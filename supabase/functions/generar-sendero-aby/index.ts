// Supabase Edge Function. Run `deno check` through the Supabase CLI, not Expo's TypeScript command.
// @ts-nocheck
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { z } from 'npm:zod@4';

const corsHeaders = {
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Content-Type': 'application/json',
};

const widgetIdsMvp = ['teoria-corta', 'opcion-multiple', 'rellenar-huecos', 'verdadero-falso', 'ordenar-lista', 'flashcard'] as const;
const pasoLeccionSchema = z.discriminatedUnion('tipo', [
  z.object({ config: z.object({ personaje: z.enum(['explicando', 'celebrando', 'pensando', 'neutro']), texto: z.string().min(1) }), id: z.string().min(1), tipo: z.literal('teoria-corta') }),
  z.object({ config: z.object({ indiceCorrecto: z.number().int().min(0), mensajeError: z.string().optional(), mensajeExito: z.string().optional(), opciones: z.array(z.string().min(1)).min(2).max(6), pregunta: z.string().min(1) }), id: z.string().min(1), tipo: z.literal('opcion-multiple') }),
  z.object({ config: z.object({ opciones: z.array(z.string().min(1)).min(1), respuestas: z.array(z.string().min(1)).min(1), textoConHuecos: z.string().min(1) }), id: z.string().min(1), tipo: z.literal('rellenar-huecos') }),
  z.object({ config: z.object({ afirmacion: z.string().min(1), esVerdadero: z.boolean(), explicacion: z.string().min(1) }), id: z.string().min(1), tipo: z.literal('verdadero-falso') }),
  z.object({ config: z.object({ elementosDesordenados: z.array(z.string().min(1)).min(2), elementosOrdenados: z.array(z.string().min(1)).min(2), instruccion: z.string().min(1) }), id: z.string().min(1), tipo: z.literal('ordenar-lista') }),
  z.object({ config: z.object({ dorso: z.string().min(1), frente: z.string().min(1) }), id: z.string().min(1), tipo: z.literal('flashcard') }),
]);
const leccionPackSchema = z.object({
  id: z.string().trim().min(1).max(120),
  pasos: z.array(pasoLeccionSchema).min(1).max(15),
  titulo: z.string().trim().min(1).max(120),
});
const nodoPathEstudioSchema = z.object({
  descripcion: z.string().trim().min(1).max(600),
  id: z.string().regex(/^[a-z0-9-]+$/),
  lessonPack: leccionPackSchema,
  objetivo: z.string().trim().min(1).max(300),
  tiempoEstimadoMinutos: z.number().int().min(1).max(180),
  tipo: z.enum(['leccion', 'evaluacion']),
  titulo: z.string().trim().min(1).max(120),
});
const pathEstudioSchema = z.object({
  conexiones: z.array(z.object({ destinoId: z.string().regex(/^[a-z0-9-]+$/), origenId: z.string().regex(/^[a-z0-9-]+$/) })).length(5),
  descripcion: z.string().trim().min(1).max(600),
  intencion: z.enum(['aprender', 'examen']),
  nodos: z.array(nodoPathEstudioSchema).length(6),
  titulo: z.string().trim().min(1).max(120),
}).superRefine((path, contexto) => {
  const lecciones = path.nodos.filter((nodo) => nodo.tipo === 'leccion');
  const evaluaciones = path.nodos.filter((nodo) => nodo.tipo === 'evaluacion');
  const examenFinal = path.nodos.at(-1);
  if (lecciones.length !== 5 || evaluaciones.length !== 1 || examenFinal?.tipo !== 'evaluacion') {
    contexto.addIssue({ code: 'custom', message: 'El camino requiere cinco lecciones y una evaluacion final.', path: ['nodos'] });
  }
  if (new Set(path.nodos.map((nodo) => nodo.id)).size !== path.nodos.length) {
    contexto.addIssue({ code: 'custom', message: 'Los nodos deben tener ids unicos.', path: ['nodos'] });
  }
  const conexionesLineales = path.conexiones.every((conexion, indice) => conexion.origenId === path.nodos[indice]?.id && conexion.destinoId === path.nodos[indice + 1]?.id);
  if (!conexionesLineales) {
    contexto.addIssue({ code: 'custom', message: 'Las conexiones deben ser lineales.', path: ['conexiones'] });
  }
});
const configuracionSchema = z.object({
  alcance: z.string().trim().max(500),
  disponibilidadSemanal: z.enum(['2', '4', '6', '8']).nullable(),
  fechaExamen: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable(),
  fuente: z.string().trim().max(500),
  intencion: z.enum(['examen', 'materia']),
  nivelInicial: z.enum(['inicio', 'basico', 'intermedio']).nullable(),
  objetivo: z.string().trim().min(1).max(240),
});
const solicitudSchema = z.object({
  configuracion: configuracionSchema,
  historial: z.array(z.object({ autor: z.enum(['aby', 'usuario']), id: z.string().max(80), texto: z.string().max(500) })).max(12),
});

function responder(status: number, cuerpo: unknown) {
  return new Response(JSON.stringify(cuerpo), { headers: corsHeaders, status });
}

function validarConfiguracion(solicitud: z.infer<typeof solicitudSchema>) {
  const { configuracion } = solicitud;
  if (!configuracion.disponibilidadSemanal || !configuracion.nivelInicial) return false;
  if (configuracion.intencion === 'examen') return Boolean(configuracion.fechaExamen && configuracion.alcance);
  return true;
}

function instruccionGemini(solicitud: z.infer<typeof solicitudSchema>) {
  const intencion = solicitud.configuracion.intencion === 'materia' ? 'aprender' : 'examen';
  return [
    'Eres Aby, guia de estudio de Lestinaty.',
    'Responde exclusivamente un objeto JSON valido, sin Markdown ni texto adicional.',
    `La intencion obligatoria es "${intencion}".`,
    'Devuelve titulo, descripcion, intencion, seis nodos y cinco conexiones.',
    'Los primeros cinco nodos deben tener tipo "leccion". El sexto y ultimo debe tener tipo "evaluacion".',
    'Cada nodo requiere id unico en kebab-case, titulo, descripcion, objetivo, tiempoEstimadoMinutos y lessonPack completo.',
    `Cada lessonPack requiere id, titulo y pasos. Usa solamente estos tipos de paso: ${widgetIdsMvp.join(', ')}.`,
    'Las conexiones deben ser lineales: nodo 1 a 2, 2 a 3, hasta el examen final.',
    'Escribe lecciones, ejemplos, preguntas y explicaciones originales. No reproduzcas texto protegido ni afirmes haber leido fuentes que no recibiste.',
    'No devuelvas JSX, estilos, colores, iconos, URLs ni instrucciones de interfaz.',
    intencion === 'examen'
      ? 'Distribuye el esfuerzo hasta la fecha del examen segun sus temas, disponibilidad y nivel.'
      : 'Ordena una progresion desde el nivel actual con sesiones proporcionales a la disponibilidad semanal.',
    `Configuracion confirmada: ${JSON.stringify(solicitud.configuracion)}`,
    `Contexto opcional: ${JSON.stringify(solicitud.historial)}`,
  ].join('\n');
}

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (request.method !== 'POST') return responder(405, { codigo: 'metodo', mensaje: 'Metodo no permitido.' });

  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY');
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  const geminiKey = Deno.env.get('GEMINI_API_KEY');
  if (!supabaseUrl || !anonKey || !serviceKey || !geminiKey) return responder(503, { codigo: 'modelo', mensaje: 'Aby no esta disponible todavia.' });

  const authorization = request.headers.get('Authorization') ?? '';
  const clienteUsuario = createClient(supabaseUrl, anonKey, { global: { headers: { Authorization: authorization } } });
  const { data: { user }, error: errorUsuario } = await clienteUsuario.auth.getUser();
  if (errorUsuario || !user) return responder(401, { codigo: 'autenticacion', mensaje: 'Inicia sesion para crear un sendero.' });

  const cuerpo = await request.json().catch(() => null);
  const solicitud = solicitudSchema.safeParse(cuerpo);
  if (!solicitud.success || !validarConfiguracion(solicitud.data)) return responder(400, { codigo: 'validacion', mensaje: 'Completa los datos de estudio antes de generar tu sendero.' });

  const clienteServidor = createClient(supabaseUrl, serviceKey);
  const bloqueo = await clienteServidor.from('aby_generation_locks').insert({ user_id: user.id });
  if (bloqueo.error) return responder(429, { codigo: 'limite', mensaje: 'Aby aun esta preparando tu propuesta.' });

  let propuestaId: string | null = null;
  try {
    const borrador = await clienteServidor.from('aby_propuestas').insert({
      configuracion: solicitud.data.configuracion,
      estado: 'generando',
      modelo: 'gemini-2.5-flash',
      usuario_id: user.id,
    }).select('id').single();
    if (borrador.error || !borrador.data) throw new Error('propuesta_no_creada');
    propuestaId = borrador.data.id;

    const abortador = new AbortController();
    const timeout = setTimeout(() => abortador.abort(), 20_000);
    let respuestaGemini: Response;
    try {
      respuestaGemini = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent', {
        body: JSON.stringify({ contents: [{ parts: [{ text: instruccionGemini(solicitud.data) }] }], generationConfig: { responseMimeType: 'application/json' } }),
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
    const path = pathEstudioSchema.safeParse(JSON.parse(texto ?? 'null'));
    if (!path.success) throw new Error('path_invalido');
    const intencionEsperada = solicitud.data.configuracion.intencion === 'materia' ? 'aprender' : 'examen';
    if (path.data.intencion !== intencionEsperada) throw new Error('intencion_invalida');

    const propuestaLista = await clienteServidor.from('aby_propuestas').update({ estado: 'lista', propuesta: path.data }).eq('id', propuestaId).eq('usuario_id', user.id);
    if (propuestaLista.error) throw new Error('propuesta_no_guardada');
    return responder(200, { path: path.data, propuestaId });
  } catch (error) {
    if (propuestaId) {
      const errorCodigo = error instanceof Error && ['path_invalido', 'intencion_invalida'].includes(error.message) ? 'validacion' : 'modelo';
      await clienteServidor.from('aby_propuestas').update({ error_codigo: errorCodigo, estado: 'fallida' }).eq('id', propuestaId).eq('usuario_id', user.id);
    }
    return responder(502, { codigo: 'modelo', mensaje: 'Aby no pudo preparar la propuesta. Intentalo de nuevo.' });
  } finally {
    await clienteServidor.from('aby_generation_locks').delete().eq('user_id', user.id);
  }
});
