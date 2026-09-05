// Supabase Edge Function. Run `deno check` through the Supabase CLI, not Expo's TypeScript command.
// @ts-nocheck
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { z } from 'npm:zod@4';

const corsHeaders = {
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Content-Type': 'application/json',
};

const widgetIds = ['checklist-asistida', 'cronometro', 'registro', 'kanban', 'eisenhower', 'foco', 'decision', 'escala', 'contador', 'planificador-semanal'] as const;
const configuracionSchema = z.object({
  alcance: z.string().trim().max(500),
  disponibilidadSemanal: z.enum(['2', '4', '6', '8']).nullable(),
  fechaExamen: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable(),
  fuente: z.string().trim().max(500),
  intencion: z.enum(['examen', 'materia', 'habito-estudio', 'rutina-estudio']).nullable(),
  nivelInicial: z.enum(['inicio', 'basico', 'intermedio']).nullable(),
  objetivo: z.string().trim().min(1).max(240),
});
const solicitudSchema = z.object({
  configuracion: configuracionSchema,
  historial: z.array(z.object({ autor: z.enum(['aby', 'usuario']), id: z.string().max(80), texto: z.string().max(500) })).max(12),
});
const actionPackSchema = z.object({
  nodoId: z.string().min(1),
  version: z.literal(1),
  widgets: z.array(z.object({ config: z.record(z.string(), z.unknown()), id: z.enum(widgetIds), rol: z.enum(['principal', 'apoyo']) })).min(1).max(3),
}).superRefine((pack, contexto) => {
  if (pack.widgets.filter((widget) => widget.rol === 'principal').length !== 1) contexto.addIssue({ code: 'custom', message: 'Cada nodo requiere un widget principal.' });
});
const propuestaSchema = z.object({
  categoriaId: z.enum(['rutinas', 'salud', 'tareas', 'habitos', 'relaciones', 'finanzas', 'estudio']),
  descripcion: z.string().min(1).max(360),
  nodos: z.array(z.object({ actionPack: actionPackSchema, descripcion: z.string().min(1).max(360), id: z.string().min(1), titulo: z.string().min(1).max(80) })).min(3).max(5),
  subcategoriaId: z.string().min(1).max(80),
  titulo: z.string().min(1).max(80),
});
const preguntaSchema = z.object({ id: z.enum(['fecha-examen', 'alcance', 'fuente', 'disponibilidad-semanal', 'nivel-inicial']), opciones: z.array(z.object({ etiqueta: z.string().min(1).max(80), valor: z.string().min(1).max(80) })).max(4), placeholder: z.string().min(1).max(120).optional(), tipo: z.enum(['cards', 'chips', 'texto']), titulo: z.string().min(1).max(120) });
const respuestaSchema = z.discriminatedUnion('tipo', [z.object({ mensaje: z.string().min(1).max(500), pregunta: preguntaSchema, tipo: z.literal('pregunta') }), z.object({ mensaje: z.string().min(1).max(500), propuesta: propuestaSchema, tipo: z.literal('propuesta') })]);

function responder(status: number, cuerpo: unknown) {
  return new Response(JSON.stringify(cuerpo), { headers: corsHeaders, status });
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
  if (errorUsuario || !user) return responder(401, { codigo: 'autenticacion', mensaje: 'Inicia sesion para hablar con Aby.' });

  const cuerpo = await request.json().catch(() => null);
  const solicitud = solicitudSchema.safeParse(cuerpo);
  if (!solicitud.success) return responder(400, { codigo: 'validacion', mensaje: 'La solicitud de Aby no es valida.' });

  const clienteServidor = createClient(supabaseUrl, serviceKey);
  const bloqueo = await clienteServidor.from('aby_generation_locks').insert({ user_id: user.id });
  if (bloqueo.error) return responder(429, { codigo: 'limite', mensaje: 'Aby aun esta preparando tu propuesta.' });

  try {
    const abortador = new AbortController();
    const timeout = setTimeout(() => abortador.abort(), 20_000);
    const instruccion = [
      'Eres Aby, guia de Lestinaty. Responde exclusivamente JSON valido.',
      'La intención es de estudio. Para examen, pregunta solo el siguiente dato faltante en orden: fecha ISO, alcance, fuente opcional, disponibilidad semanal y nivel inicial.',
      'Cuando fecha, alcance, disponibilidad y nivel estén completos, devuelve una propuesta practica de 3 a 5 nodos en la categoría estudio.',
      'No afirmes haber leído un libro ni reproduzcas texto protegido. Genera explicaciones y práctica originales.',
      'Cada actionPack debe tener exactamente un widget principal y maximo dos apoyos.',
      `Configuracion confirmada: ${JSON.stringify(solicitud.data.configuracion)}`,
      `Conversacion reciente: ${JSON.stringify(solicitud.data.historial)}`,
    ].join('\n');
    const respuestaGemini = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent', {
      body: JSON.stringify({ contents: [{ parts: [{ text: instruccion }] }], generationConfig: { responseMimeType: 'application/json' } }),
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': geminiKey },
      method: 'POST',
      signal: abortador.signal,
    });
    clearTimeout(timeout);
    if (!respuestaGemini.ok) return responder(502, { codigo: 'modelo', mensaje: 'Aby no pudo preparar la propuesta. Intentalo de nuevo.' });

    const jsonGemini = await respuestaGemini.json();
    const texto = jsonGemini.candidates?.[0]?.content?.parts?.[0]?.text;
    const respuesta = respuestaSchema.safeParse(JSON.parse(texto ?? 'null'));
    if (!respuesta.success) return responder(422, { codigo: 'validacion', mensaje: 'Aby preparo una ruta que no es compatible. Intentalo de nuevo.' });

    return responder(200, respuesta.data.tipo === 'propuesta' ? { ...respuesta.data, propuesta: { ...respuesta.data.propuesta, configuracion: solicitud.data.configuracion } } : respuesta.data);
  } catch (_error) {
    return responder(502, { codigo: 'modelo', mensaje: 'Aby no pudo preparar la propuesta. Intentalo de nuevo.' });
  } finally {
    await clienteServidor.from('aby_generation_locks').delete().eq('user_id', user.id);
  }
});
