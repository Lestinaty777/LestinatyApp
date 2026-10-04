// Supabase Edge Function. Run `deno check` through the Supabase CLI, not Expo's TypeScript command.
// @ts-nocheck
//
// Fase 11.2 — detalla UNA sección que hoy solo tiene título ('solo_titulo'),
// usando el contexto que el usuario le da en ese momento (cómo le fue en la
// anterior, qué quiere ajustar) — nunca se detallan varias de una, ver la
// decisión de "generación progresiva" en el plan. Guarda el resultado como
// una planes_propuestas pendiente de aceptar (aceptar-propuesta-plan la
// convierte en días/bloques/ítems reales); esta función nunca escribe en
// planes_dias/planes_bloques/planes_bloque_items directamente.
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
const seccionDetalleSchema = z.object({ dias: z.array(diaSchema).min(1).max(14) });

const solicitudSchema = z.object({
  contextoUsuario: z.string().trim().min(1).max(1000),
  seccionId: z.string().uuid(),
});

function responder(status: number, cuerpo: unknown) {
  return new Response(JSON.stringify(cuerpo), { headers: corsHeaders, status });
}

function instruccionGemini(input: {
  bloquesPorDia: number;
  contextoUsuario: string;
  objetivoPlan: string;
  secciones: { resumen: string | null; titulo: string }[];
  seccionIndice: number;
}) {
  const momentos = MOMENTOS.slice(0, input.bloquesPorDia).join(', ');
  const mapaSecciones = input.secciones
    .map((seccion, indice) => `${indice + 1}. ${seccion.titulo}${indice === input.seccionIndice ? ' (ESTA ES LA QUE TENES QUE DETALLAR AHORA)' : ''}${seccion.resumen ? ` — ${seccion.resumen}` : ''}`)
    .join('\n');
  return [
    'Eres Aby, asistente de planificación de Lestinaty.',
    'Responde exclusivamente un objeto JSON valido, sin Markdown ni texto adicional.',
    `El objetivo general del plan es: "${input.objetivoPlan}".`,
    'Este es el mapa completo de secciones del plan (para que la sección de hoy encaje con el resto, sin repetir lo que ya cubren otras):',
    mapaSecciones,
    `El usuario te contó esto sobre cómo le fue hasta ahora / qué quiere para esta sección: "${input.contextoUsuario}".`,
    'Devuelve SOLO "dias": el detalle de la sección marcada arriba, como lista de días.',
    `Cada día tiene hasta ${input.bloquesPorDia} bloques, cada uno con "momento" (usa solo: ${momentos}), "mensajeContexto" (cómo encarar ese bloque, una o dos frases) e "items" (2-3 cosas concretas para hacer, cortas).`,
    'No repitas el mismo "momento" dos veces en el mismo día.',
    'Usa el contexto que dio el usuario para ajustar el ritmo o el enfoque — no ignores lo que contó.',
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
  if (errorUsuario || !user) return responder(401, { codigo: 'autenticacion', mensaje: 'Inicia sesion para seguir tu plan.' });

  const solicitud = solicitudSchema.safeParse(await request.json().catch(() => null));
  if (!solicitud.success) return responder(400, { codigo: 'validacion', mensaje: 'Contanos un poco de contexto antes de detallar la sección.' });

  const clienteServidor = createClient(supabaseUrl, serviceKey);

  // La sección tiene que ser de un plan del usuario y seguir 'solo_titulo'
  // — ni de otro usuario, ni una que ya se detalló o completó.
  const seccionFila = await clienteServidor.from('planes_secciones').select('estado, orden, plan_id, resumen, titulo').eq('id', solicitud.data.seccionId).maybeSingle();
  if (seccionFila.error || !seccionFila.data) return responder(404, { codigo: 'no_encontrada', mensaje: 'No encontramos esa sección.' });
  if (seccionFila.data.estado !== 'solo_titulo') return responder(409, { codigo: 'conflicto', mensaje: 'Esta sección ya tiene detalle.' });

  const planFila = await clienteServidor.from('planes_items').select('bloques_por_dia, objetivo_original, titulo, usuario_id').eq('id', seccionFila.data.plan_id).maybeSingle();
  if (planFila.error || !planFila.data || planFila.data.usuario_id !== user.id) return responder(404, { codigo: 'no_encontrada', mensaje: 'No encontramos ese plan.' });

  const seccionesFila = await clienteServidor.from('planes_secciones').select('orden, resumen, titulo').eq('plan_id', seccionFila.data.plan_id).order('orden');
  const secciones = seccionesFila.data ?? [];
  const seccionIndice = secciones.findIndex((seccion) => seccion.orden === seccionFila.data.orden);

  const acceso = await verificarAccesoAby(clienteServidor, user.id);
  if (!acceso.ok) return responder(acceso.codigo === 'horizon_inactivo' ? 402 : 429, { codigo: acceso.codigo, mensaje: acceso.mensaje });

  const bloqueo = await clienteServidor.from('aby_generation_locks').insert({ user_id: user.id });
  if (bloqueo.error) return responder(429, { codigo: 'limite', mensaje: 'Aby aun esta preparando algo para vos.' });

  let propuestaId: string | null = null;
  try {
    const borrador = await clienteServidor.from('planes_propuestas').insert({
      modelo: 'gemini-2.5-flash',
      objetivo: solicitud.data.contextoUsuario,
      seccion_id: solicitud.data.seccionId,
      tipo: 'seccion',
      usuario_id: user.id,
    }).select('id').single();
    if (borrador.error || !borrador.data) throw new Error('propuesta_no_creada');
    propuestaId = borrador.data.id;

    const abortador = new AbortController();
    const timeout = setTimeout(() => abortador.abort(), 20_000);
    let respuestaGemini: Response;
    try {
      respuestaGemini = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent', {
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: instruccionGemini({
                bloquesPorDia: planFila.data.bloques_por_dia,
                contextoUsuario: solicitud.data.contextoUsuario,
                objetivoPlan: planFila.data.objetivo_original ?? planFila.data.titulo,
                secciones,
                seccionIndice,
              }),
            }],
          }],
          generationConfig: { responseMimeType: 'application/json' },
        }),
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
    const detalle = seccionDetalleSchema.safeParse(JSON.parse(texto ?? 'null'));
    if (!detalle.success) throw new Error('detalle_invalido');

    const propuestaLista = await clienteServidor.from('planes_propuestas').update({ estado: 'lista', propuesta: detalle.data }).eq('id', propuestaId).eq('usuario_id', user.id);
    if (propuestaLista.error) throw new Error('propuesta_no_guardada');

    await registrarUsoAby(clienteServidor, user.id);
    return responder(200, { propuesta: detalle.data, propuestaId });
  } catch (error) {
    if (propuestaId) {
      const errorCodigo = error instanceof Error && error.message === 'detalle_invalido' ? 'validacion' : 'modelo';
      await clienteServidor.from('planes_propuestas').update({ error_codigo: errorCodigo, estado: 'fallida' }).eq('id', propuestaId).eq('usuario_id', user.id);
    }
    return responder(502, { codigo: 'modelo', mensaje: 'Aby no pudo detallar esta sección. Intentalo de nuevo.' });
  } finally {
    await clienteServidor.from('aby_generation_locks').delete().eq('user_id', user.id);
  }
});
