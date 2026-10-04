// Supabase Edge Function. The service role remains server-only.
// @ts-nocheck
//
// Fase 11.2 — convierte una planes_propuestas 'lista' (de generar-plan-inicial
// o detallar-seccion-plan) en filas reales. Mismo patrón que
// aceptar-propuesta-aby: solo recibe { propuestaId }, nunca un payload editado
// por el cliente — la "revisión" es ver/descartar lo generado, no reescribirlo
// a mano antes de aceptar (igual que ya funciona el flujo de estudio). Una vez
// aceptado, las filas reales (planes_bloque_items, etc.) son editables con
// UPDATE normal como cualquier otro dato de Tareas/Planes.
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { z } from 'npm:zod@4';

import { construirPlanDesdePropuesta, type MomentoBloque } from './construirPlanDesdePropuesta.ts';

const corsHeaders = {
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Content-Type': 'application/json',
};

const bloqueSchema = z.object({
  items: z.array(z.string().trim().min(1)).min(1),
  mensajeContexto: z.string().trim().min(1),
  momento: z.enum(['manana', 'tarde', 'noche']),
});
const diaSchema = z.object({ bloques: z.array(bloqueSchema).min(1), titulo: z.string().trim().min(1).optional() });
const planInicialPropuestaSchema = z.object({
  descripcionPlan: z.string().trim().min(1),
  primeraSeccionDias: z.array(diaSchema).min(1),
  secciones: z.array(z.object({ resumen: z.string().trim().min(1), titulo: z.string().trim().min(1) })).min(1),
  tituloPlan: z.string().trim().min(1),
});
const seccionPropuestaSchema = z.object({ dias: z.array(diaSchema).min(1) });

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
      const resultado = await clienteServidor.from('planes_propuestas').update({ aceptada_at: new Date().toISOString(), estado: 'aceptada' }).eq('id', propuestaId).eq('estado', 'generando');
      if (resultado.error) throw new Error(resultado.error.message);
    },
    crearBloque: async ({ diaId, mensajeContexto, momento }: { diaId: string; mensajeContexto: string; momento: MomentoBloque }) =>
      exigirFila(await clienteServidor.from('planes_bloques').insert({ dia_id: diaId, mensaje_contexto: mensajeContexto, momento }).select('id').single()),
    crearDia: async ({ orden, seccionId, titulo }: { orden: number; seccionId: string; titulo?: string }) =>
      exigirFila(await clienteServidor.from('planes_dias').insert({ orden, seccion_id: seccionId, titulo: titulo ?? null }).select('id').single()),
    crearInstancia: async ({ esCreador, planId, usuarioId }: { esCreador: boolean; planId: string; usuarioId: string }) =>
      exigirFila(await clienteServidor.from('planes_instancias').insert({ es_creador: esCreador, plan_id: planId, usuario_id: usuarioId }).select('id').single()),
    crearItems: async (items: readonly { bloqueId: string; orden: number; titulo: string }[]) => {
      const resultado = await clienteServidor.from('planes_bloque_items').insert(items.map((item) => ({ bloque_id: item.bloqueId, orden: item.orden, titulo: item.titulo })));
      if (resultado.error) throw new Error(resultado.error.message);
    },
    crearPlan: async ({ bloquesPorDia, descripcion, objetivoOriginal, titulo, usuarioId }: { bloquesPorDia: number; descripcion: string; objetivoOriginal: string; titulo: string; usuarioId: string }) =>
      exigirFila(await clienteServidor.from('planes_items').insert({ bloques_por_dia: bloquesPorDia, descripcion, modo: 'ia', objetivo_original: objetivoOriginal, titulo, usuario_id: usuarioId }).select('id').single()),
    crearSeccion: async ({ estado, orden, planId, resumen, titulo }: { estado: 'detallada' | 'solo_titulo'; orden: number; planId: string; resumen: string; titulo: string }) =>
      exigirFila(await clienteServidor.from('planes_secciones').insert({
        detallada_en: estado === 'detallada' ? new Date().toISOString() : null,
        estado,
        orden,
        plan_id: planId,
        resumen,
        titulo,
      }).select('id').single()),
    eliminarDiasDeSeccion: async ({ seccionId }: { seccionId: string }) => {
      const resultado = await clienteServidor.from('planes_dias').delete().eq('seccion_id', seccionId);
      if (resultado.error) throw new Error(resultado.error.message);
    },
    eliminarPlan: async ({ planId }: { planId: string }) => {
      const resultado = await clienteServidor.from('planes_items').delete().eq('id', planId);
      if (resultado.error) throw new Error(resultado.error.message);
    },
    marcarPropuestaFallida: async ({ errorCodigo, propuestaId }: { errorCodigo: string; propuestaId: string }) => {
      const resultado = await clienteServidor.from('planes_propuestas').update({ error_codigo: errorCodigo, estado: 'fallida' }).eq('id', propuestaId).eq('estado', 'generando');
      if (resultado.error) throw new Error(resultado.error.message);
    },
    marcarSeccionDetallada: async ({ seccionId }: { seccionId: string }) => {
      const resultado = await clienteServidor.from('planes_secciones').update({ detallada_en: new Date().toISOString(), estado: 'detallada' }).eq('id', seccionId);
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
  if (!supabaseUrl || !anonKey || !serviceKey) return responder(503, { codigo: 'servidor', mensaje: 'La creacion de planes no esta disponible.' });

  const authorization = request.headers.get('Authorization') ?? '';
  const clienteUsuario = createClient(supabaseUrl, anonKey, { global: { headers: { Authorization: authorization } } });
  const { data: { user }, error: errorUsuario } = await clienteUsuario.auth.getUser();
  if (errorUsuario || !user) return responder(401, { codigo: 'autenticacion', mensaje: 'Inicia sesion para crear tu plan.' });

  const solicitud = solicitudSchema.safeParse(await request.json().catch(() => null));
  if (!solicitud.success) return responder(400, { codigo: 'validacion', mensaje: 'La propuesta no es valida.' });

  const clienteServidor = createClient(supabaseUrl, serviceKey);
  const propuesta = await clienteServidor.from('planes_propuestas')
    .update({ estado: 'generando' })
    .eq('id', solicitud.data.propuestaId)
    .eq('usuario_id', user.id)
    .eq('estado', 'lista')
    .gt('expira_at', new Date().toISOString())
    .select('id, objetivo, propuesta, seccion_id, tipo, bloques_por_dia')
    .maybeSingle();
  if (propuesta.error) return responder(500, { codigo: 'servidor', mensaje: 'No pudimos preparar tu plan.' });
  if (!propuesta.data) return responder(409, { codigo: 'conflicto', mensaje: 'Esta propuesta ya fue usada, vencio o no existe.' });

  try {
    if (propuesta.data.tipo === 'plan_inicial') {
      const contenido = planInicialPropuestaSchema.safeParse(propuesta.data.propuesta);
      if (!contenido.success) throw new Error('propuesta_invalida');

      const resultado = await construirPlanDesdePropuesta(crearRepositorio(clienteServidor), {
        bloquesPorDia: propuesta.data.bloques_por_dia ?? 3,
        descripcion: contenido.data.descripcionPlan,
        objetivoOriginal: propuesta.data.objetivo,
        primeraSeccionDias: contenido.data.primeraSeccionDias,
        propuestaId: propuesta.data.id,
        secciones: contenido.data.secciones,
        tipo: 'plan_inicial',
        titulo: contenido.data.tituloPlan,
        usuarioId: user.id,
      });
      return responder(200, { planId: resultado.planId });
    }

    const contenido = seccionPropuestaSchema.safeParse(propuesta.data.propuesta);
    if (!contenido.success) throw new Error('propuesta_invalida');
    if (!propuesta.data.seccion_id) throw new Error('propuesta_invalida');

    const resultado = await construirPlanDesdePropuesta(crearRepositorio(clienteServidor), {
      dias: contenido.data.dias,
      propuestaId: propuesta.data.id,
      seccionId: propuesta.data.seccion_id,
      tipo: 'seccion',
      usuarioId: user.id,
    });
    return responder(200, { seccionId: resultado.seccionId });
  } catch (error) {
    if (error instanceof Error && error.message === 'propuesta_invalida') {
      await clienteServidor.from('planes_propuestas').update({ error_codigo: 'propuesta_invalida', estado: 'fallida' }).eq('id', propuesta.data.id).eq('estado', 'generando');
      return responder(422, { codigo: 'validacion', mensaje: 'La propuesta no se puede convertir en un plan.' });
    }
    return responder(500, { codigo: 'servidor', mensaje: 'No pudimos crear tu plan. Intentalo de nuevo.' });
  }
});
