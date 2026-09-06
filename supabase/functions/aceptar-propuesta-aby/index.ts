// Supabase Edge Function. The service role remains server-only.
// @ts-nocheck
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { z } from 'npm:zod@4';

import { construirSenderoDesdePropuesta } from './construirSenderoDesdePropuesta.ts';

const corsHeaders = {
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Content-Type': 'application/json',
};

const pasoLeccionSchema = z.object({
  config: z.record(z.string(), z.unknown()),
  id: z.string().trim().min(1),
  tipo: z.enum(['teoria-corta', 'opcion-multiple', 'rellenar-huecos', 'verdadero-falso', 'ordenar-lista', 'flashcard']),
});
const pathEstudioSchema = z.object({
  conexiones: z.array(z.object({ destinoId: z.string().regex(/^[a-z0-9-]+$/), origenId: z.string().regex(/^[a-z0-9-]+$/) })).length(5),
  descripcion: z.string().trim().min(1).max(600),
  intencion: z.enum(['aprender', 'examen']),
  nodos: z.array(z.object({
    descripcion: z.string().trim().min(1).max(600),
    id: z.string().regex(/^[a-z0-9-]+$/),
    lessonPack: z.object({ id: z.string().trim().min(1), pasos: z.array(pasoLeccionSchema).min(1).max(15), titulo: z.string().trim().min(1) }),
    objetivo: z.string().trim().min(1).max(300),
    tiempoEstimadoMinutos: z.number().int().min(1).max(180),
    tipo: z.enum(['leccion', 'evaluacion']),
    titulo: z.string().trim().min(1).max(120),
  })).length(6),
  titulo: z.string().trim().min(1).max(120),
}).superRefine((path, contexto) => {
  const evaluacionFinal = path.nodos.at(-1);
  if (path.nodos.filter((nodo) => nodo.tipo === 'leccion').length !== 5 || path.nodos.filter((nodo) => nodo.tipo === 'evaluacion').length !== 1 || evaluacionFinal?.tipo !== 'evaluacion') {
    contexto.addIssue({ code: 'custom', message: 'El camino requiere cinco lecciones y una evaluacion final.' });
  }
  if (new Set(path.nodos.map((nodo) => nodo.id)).size !== path.nodos.length) {
    contexto.addIssue({ code: 'custom', message: 'Los nodos deben tener ids unicos.' });
  }
  const conexionesLineales = path.conexiones.every((conexion, indice) => conexion.origenId === path.nodos[indice]?.id && conexion.destinoId === path.nodos[indice + 1]?.id);
  if (!conexionesLineales) contexto.addIssue({ code: 'custom', message: 'Las conexiones deben ser lineales.' });
});
const solicitudSchema = z.object({ propuestaId: z.string().uuid() });

function responder(status: number, cuerpo: unknown) {
  return new Response(JSON.stringify(cuerpo), { headers: corsHeaders, status });
}

function exigirFila(resultado: { data: unknown; error: { message: string } | null }) {
  if (resultado.error || !resultado.data) throw new Error(resultado.error?.message ?? 'No se recibio una fila de Supabase.');
  return resultado.data as { id: string };
}

function crearRepositorio(clienteServidor: ReturnType<typeof createClient>) {
  return {
    aceptarPropuesta: async ({ propuestaId }: { propuestaId: string }) => {
      const resultado = await clienteServidor.from('aby_propuestas').update({ aceptada_at: new Date().toISOString(), estado: 'aceptada' }).eq('id', propuestaId).eq('estado', 'generando');
      if (resultado.error) throw new Error(resultado.error.message);
    },
    activarNivel: async ({ nivelId }: { nivelId: string }) => {
      const resultado = await clienteServidor.from('sendero_niveles').update({ estado: 'activo' }).eq('id', nivelId).eq('estado', 'borrador');
      if (resultado.error) throw new Error(resultado.error.message);
    },
    activarSendero: async ({ senderoId }: { senderoId: string }) => {
      const resultado = await clienteServidor.from('senderos').update({ estado: 'activo' }).eq('id', senderoId).eq('estado', 'borrador');
      if (resultado.error) throw new Error(resultado.error.message);
    },
    crearCofre: async ({ gemas, nivelId, nodoEvaluacionId }: { gemas: number; nivelId: string; nodoEvaluacionId: string }) => {
      const resultado = await clienteServidor.from('sendero_cofres').insert({ gemas, nivel_id: nivelId, nodo_evaluacion_id: nodoEvaluacionId });
      if (resultado.error) throw new Error(resultado.error.message);
    },
    crearConexiones: async ({ conexiones, senderoId }: { conexiones: readonly { destinoId: string; origenId: string }[]; senderoId: string }) => {
      const resultado = await clienteServidor.from('sendero_conexiones').insert(conexiones.map((conexion) => ({ nodo_destino_id: conexion.destinoId, nodo_origen_id: conexion.origenId, sendero_id: senderoId })));
      if (resultado.error) throw new Error(resultado.error.message);
    },
    crearMeta: async ({ descripcion, titulo, usuarioId }: { descripcion: string; titulo: string; usuarioId: string }) => exigirFila(await clienteServidor.from('metas').insert({ descripcion, titulo, usuario_id: usuarioId }).select('id').single()),
    crearNivel: async ({ numero, senderoId, titulo }: { numero: number; senderoId: string; titulo: string }) => exigirFila(await clienteServidor.from('sendero_niveles').insert({ numero, sendero_id: senderoId, titulo }).select('id').single()),
    crearNodos: async (nodos: readonly { criterioAprobado: Record<string, unknown>; descripcion: string; lessonPack: unknown; nivelId: string; objetivo: string; orden: number; pathId: string; tiempoEstimadoMinutos: number; tipo: string; titulo: string }[]) => {
      const resultado = await clienteServidor.from('sendero_nodos').insert(nodos.map((nodo) => ({
        criterio_aprobado: nodo.criterioAprobado,
        descripcion: nodo.descripcion,
        lesson_pack: nodo.lessonPack,
        nivel_id: nodo.nivelId,
        objetivo: nodo.objetivo,
        orden: nodo.orden,
        tiempo_estimado_minutos: nodo.tiempoEstimadoMinutos,
        tipo: nodo.tipo,
        titulo: nodo.titulo,
      }))).select('id, orden');
      if (resultado.error || !resultado.data || resultado.data.length !== nodos.length) throw new Error(resultado.error?.message ?? 'No se pudieron crear todos los nodos.');
      return Object.fromEntries(resultado.data.map((nodo) => [nodos.find((item) => item.orden === nodo.orden)?.pathId, nodo.id]));
    },
    crearSendero: async ({ descripcion, metaId, titulo }: { descripcion: string; metaId: string; titulo: string }) => exigirFila(await clienteServidor.from('senderos').insert({ categoria_codigo: 'estudio', descripcion, meta_id: metaId, origen: 'aby', titulo }).select('id').single()),
    eliminarMeta: async ({ metaId }: { metaId: string }) => {
      const resultado = await clienteServidor.from('metas').delete().eq('id', metaId);
      if (resultado.error) throw new Error(resultado.error.message);
    },
    marcarPropuestaFallida: async ({ errorCodigo, propuestaId }: { errorCodigo: string; propuestaId: string }) => {
      const resultado = await clienteServidor.from('aby_propuestas').update({ error_codigo: errorCodigo, estado: 'fallida' }).eq('id', propuestaId).eq('estado', 'generando');
      if (resultado.error) throw new Error(resultado.error.message);
    },
  };
}

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (request.method !== 'POST') return responder(405, { codigo: 'metodo', mensaje: 'Metodo no permitido.' });

  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY');
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!supabaseUrl || !anonKey || !serviceKey) return responder(503, { codigo: 'servidor', mensaje: 'La creacion de senderos no esta disponible.' });

  const authorization = request.headers.get('Authorization') ?? '';
  const clienteUsuario = createClient(supabaseUrl, anonKey, { global: { headers: { Authorization: authorization } } });
  const { data: { user }, error: errorUsuario } = await clienteUsuario.auth.getUser();
  if (errorUsuario || !user) return responder(401, { codigo: 'autenticacion', mensaje: 'Inicia sesion para crear tu sendero.' });

  const solicitud = solicitudSchema.safeParse(await request.json().catch(() => null));
  if (!solicitud.success) return responder(400, { codigo: 'validacion', mensaje: 'La propuesta no es valida.' });

  const clienteServidor = createClient(supabaseUrl, serviceKey);
  const propuesta = await clienteServidor.from('aby_propuestas')
    .update({ estado: 'generando' })
    .eq('id', solicitud.data.propuestaId)
    .eq('usuario_id', user.id)
    .eq('estado', 'lista')
    .gt('expira_at', new Date().toISOString())
    .select('id, propuesta')
    .maybeSingle();
  if (propuesta.error) return responder(500, { codigo: 'servidor', mensaje: 'No pudimos preparar tu sendero.' });
  if (!propuesta.data) return responder(409, { codigo: 'conflicto', mensaje: 'Esta propuesta ya fue usada, vencio o no existe.' });

  const path = pathEstudioSchema.safeParse(propuesta.data.propuesta);
  if (!path.success) {
    await clienteServidor.from('aby_propuestas').update({ error_codigo: 'propuesta_invalida', estado: 'fallida' }).eq('id', propuesta.data.id).eq('estado', 'generando');
    return responder(422, { codigo: 'validacion', mensaje: 'La propuesta no se puede convertir en un sendero.' });
  }

  try {
    const resultado = await construirSenderoDesdePropuesta(crearRepositorio(clienteServidor), {
      path: path.data,
      propuestaId: propuesta.data.id,
      usuarioId: user.id,
    });
    return responder(200, { senderoId: resultado.senderoId });
  } catch (_error) {
    return responder(500, { codigo: 'servidor', mensaje: 'No pudimos crear tu sendero. Intentalo de nuevo.' });
  }
});
