// Supabase Edge Function. Run `deno check` through the Supabase CLI, not Expo's TypeScript command.
// @ts-nocheck
//
// Fase 11.2 — primera llamada del flujo de creación de un Plan con IA:
// genera el título/descripción del plan, el título+resumen de TODAS sus
// secciones (para que el "mapa" completo se vea desde el día 1), y el
// detalle completo (días/bloques/ítems) de SOLO la primera sección — el
// resto se detalla una por una con detallar-seccion-plan, a medida que el
// usuario llega a ellas (ver decisión de producto en el plan: generación
// progresiva, no todo de una).
//
// Mismo esqueleto que generar-sendero-aby (lock anti-concurrencia, propuesta
// guardada en una tabla "pendiente de aceptar", Gemini 2.5 Flash) más dos
// chequeos nuevos que ese flujo no tenía: Horizon activo y tope mensual de
// generaciones (ver _shared/accesoAbyPlanes.ts).
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { z } from 'npm:zod@4';

import { registrarUsoAby, verificarAccesoAby } from '../_shared/accesoAbyPlanes.ts';

const corsHeaders = {
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Content-Type': 'application/json',
};

const MOMENTOS = ['manana', 'tarde', 'noche'] as const;

const itemSchema = z.string().trim().min(1).max(160);
const bloqueSchema = z.object({
  items: z.array(itemSchema).min(1).max(6),
  mensajeContexto: z.string().trim().min(1).max(400),
  momento: z.enum(MOMENTOS),
});
const diaSchema = z.object({
  bloques: z.array(bloqueSchema).min(1).max(3),
  titulo: z.string().trim().max(120).optional(),
}).superRefine((dia, contexto) => {
  if (new Set(dia.bloques.map((bloque) => bloque.momento)).size !== dia.bloques.length) {
    contexto.addIssue({ code: 'custom', message: 'Los bloques de un dia no pueden repetir momento.' });
  }
});
const seccionResumenSchema = z.object({
  resumen: z.string().trim().min(1).max(300),
  titulo: z.string().trim().min(1).max(120),
});
const planInicialSchema = z.object({
  descripcionPlan: z.string().trim().min(1).max(500),
  primeraSeccionDias: z.array(diaSchema).min(1).max(14),
  secciones: z.array(seccionResumenSchema).min(2).max(8),
  tituloPlan: z.string().trim().min(1).max(120),
});

const solicitudSchema = z.object({
  bloquesPorDia: z.union([z.literal(1), z.literal(2), z.literal(3)]),
  objetivo: z.string().trim().min(1).max(500),
});

function responder(status: number, cuerpo: unknown) {
  return new Response(JSON.stringify(cuerpo), { headers: corsHeaders, status });
}

function instruccionGemini(objetivo: string, bloquesPorDia: number) {
  const momentos = MOMENTOS.slice(0, bloquesPorDia).join(', ');
  return [
    'Eres Aby, asistente de planificación de Lestinaty.',
    'Responde exclusivamente un objeto JSON valido, sin Markdown ni texto adicional.',
    `El usuario quiere lograr esto: "${objetivo}".`,
    'Divide el plan completo en SECCIONES: fases con un tema claro (ej. "Semana 1: Planificación"), suficientes para cubrir el objetivo de principio a fin.',
    'Devuelve tituloPlan, descripcionPlan, y "secciones": titulo + resumen de una linea de CADA seccion del plan completo (sin dias ni bloques todavia).',
    'Devuelve tambien "primeraSeccionDias": el detalle completo de la PRIMERA seccion nada mas, como lista de dias.',
    `Cada dia de "primeraSeccionDias" tiene hasta ${bloquesPorDia} bloques, cada uno con "momento" (usa solo: ${momentos}), "mensajeContexto" (como encarar ese bloque, una o dos frases) e "items" (2-3 cosas concretas para hacer, cortas).`,
    'No repitas el mismo "momento" dos veces en el mismo dia.',
    'No detalles ninguna seccion aparte de la primera en "primeraSeccionDias" - las demas quedan solo con titulo y resumen en "secciones", se detallan despues.',
    'Se especifico y realista para el objetivo dado. No des consejo legal, medico o financiero como si fueras un profesional — si el objetivo lo roza, mantene las acciones generales y sugeri consultar a alguien calificado.',
  ].join('\n');
}

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (request.method !== 'POST') return responder(405, { codigo: 'metodo', mensaje: 'Metodo no permitido.' });

  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY');
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  const geminiKey = Deno.env.get('GEMINI_API_KEY');
  if (!supabaseUrl || !anonKey || !serviceKey || !geminiKey) return responder(503, { codigo: 'servidor', mensaje: 'Aby no esta disponible todavia.' });

  const authorization = request.headers.get('Authorization') ?? '';
  const clienteUsuario = createClient(supabaseUrl, anonKey, { global: { headers: { Authorization: authorization } } });
  const { data: { user }, error: errorUsuario } = await clienteUsuario.auth.getUser();
  if (errorUsuario || !user) return responder(401, { codigo: 'autenticacion', mensaje: 'Inicia sesion para crear un plan.' });

  const solicitud = solicitudSchema.safeParse(await request.json().catch(() => null));
  if (!solicitud.success) return responder(400, { codigo: 'validacion', mensaje: 'Contanos tu objetivo antes de generar el plan.' });

  const clienteServidor = createClient(supabaseUrl, serviceKey);

  const acceso = await verificarAccesoAby(clienteServidor, user.id);
  if (!acceso.ok) return responder(acceso.codigo === 'horizon_inactivo' ? 402 : 429, { codigo: acceso.codigo, mensaje: acceso.mensaje });

  const bloqueo = await clienteServidor.from('aby_generation_locks').insert({ user_id: user.id });
  if (bloqueo.error) return responder(429, { codigo: 'limite', mensaje: 'Aby aun esta preparando algo para vos.' });

  let propuestaId: string | null = null;
  try {
    const borrador = await clienteServidor.from('planes_propuestas').insert({
      bloques_por_dia: solicitud.data.bloquesPorDia,
      modelo: 'gemini-2.5-flash',
      objetivo: solicitud.data.objetivo,
      tipo: 'plan_inicial',
      usuario_id: user.id,
    }).select('id').single();
    if (borrador.error || !borrador.data) throw new Error('propuesta_no_creada');
    propuestaId = borrador.data.id;

    const abortador = new AbortController();
    const timeout = setTimeout(() => abortador.abort(), 20_000);
    let respuestaGemini: Response;
    try {
      respuestaGemini = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent', {
        body: JSON.stringify({ contents: [{ parts: [{ text: instruccionGemini(solicitud.data.objetivo, solicitud.data.bloquesPorDia) }] }], generationConfig: { responseMimeType: 'application/json' } }),
        headers: { 'Content-Type': 'application/json', 'x-goog-api-key': geminiKey },
        method: 'POST',
        signal: abortador.signal,
      });
    } finally {
      clearTimeout(timeout);
    }
    if (!respuestaGemini.ok) throw new Error('modelo_no_disponible');

    const jsonGemini = await respuestaGemini.json();
    const texto = jsonGemini.candidates?.[0]?.content?.parts?.[0]?.text;
    const plan = planInicialSchema.safeParse(JSON.parse(texto ?? 'null'));
    if (!plan.success) throw new Error('plan_invalido');

    const propuestaLista = await clienteServidor.from('planes_propuestas').update({ estado: 'lista', propuesta: plan.data }).eq('id', propuestaId).eq('usuario_id', user.id);
    if (propuestaLista.error) throw new Error('propuesta_no_guardada');

    await registrarUsoAby(clienteServidor, user.id);
    return responder(200, { propuesta: plan.data, propuestaId });
  } catch (error) {
    if (propuestaId) {
      const errorCodigo = error instanceof Error && error.message === 'plan_invalido' ? 'validacion' : 'modelo';
      await clienteServidor.from('planes_propuestas').update({ error_codigo: errorCodigo, estado: 'fallida' }).eq('id', propuestaId).eq('usuario_id', user.id);
    }
    return responder(502, { codigo: 'modelo', mensaje: 'Aby no pudo preparar tu plan. Intentalo de nuevo.' });
  } finally {
    await clienteServidor.from('aby_generation_locks').delete().eq('user_id', user.id);
  }
});
