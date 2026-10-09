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

const itemSchema = z.object({
  metaValor: z.number().positive().optional(),
  tipo: z.enum(['simple', 'contador', 'cronometro']).default('simple'),
  titulo: z.string().trim().min(1),
  unidad: z.string().trim().optional(),
});
const bloqueSchema = z.object({
  items: z.array(itemSchema).min(1),
  mensajeContexto: z.string().trim().min(1),
  momento: z.enum(['manana', 'tarde', 'noche']),
});
const diaSchema = z.object({ bloques: z.array(bloqueSchema).min(1), titulo: z.string().trim().min(1).optional() });
const ramaResumenSchema = z.object({ nombre: z.string().trim().min(1), resumen: z.string().trim().min(1) });
const planInicialPropuestaSchema = z.object({
  descripcionPlan: z.string().trim().min(1),
  // Exactamente una de las dos: "ramas" (todavia sin detalle) o
  // secciones+primeraSeccionDias (modo de siempre) — ver generar-plan-inicial.
  primeraSeccionDias: z.array(diaSchema).min(1).optional(),
  ramas: z.array(ramaResumenSchema).min(1).optional(),
  secciones: z.array(z.object({ resumen: z.string().trim().min(1), titulo: z.string().trim().min(1) })).min(1).optional(),
  tituloPlan: z.string().trim().min(1),
});
const ramaPropuestaSchema = z.object({
  descripcionPlan: z.string().trim().min(1).optional(),
  primeraSeccionDias: z.array(diaSchema).min(1),
  secciones: z.array(z.object({ resumen: z.string().trim().min(1), titulo: z.string().trim().min(1) })).min(1),
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
    crearItems: async (items: readonly { bloqueId: string; metaValor?: number; orden: number; tipo: string; titulo: string; unidad?: string }[]) => {
      const resultado = await clienteServidor.from('planes_bloque_items').insert(items.map((item) => ({
        bloque_id: item.bloqueId, meta_valor: item.metaValor ?? null, orden: item.orden, tipo: item.tipo, titulo: item.titulo, unidad: item.unidad ?? null,
      })));
      if (resultado.error) throw new Error(resultado.error.message);
    },
    crearPlan: async ({ descripcion, disponibilidad, objetivoOriginal, titulo, usuarioId }: { descripcion: string; disponibilidad: Record<string, number | string>; objetivoOriginal: string; titulo: string; usuarioId: string }) =>
      exigirFila(await clienteServidor.from('planes_items').insert({ descripcion, disponibilidad, modo: 'ia', objetivo_original: objetivoOriginal, titulo, usuario_id: usuarioId }).select('id').single()),
    crearRama: async ({ nombre, orden, planId, resumen }: { nombre: string; orden: number; planId: string; resumen: string }) =>
      exigirFila(await clienteServidor.from('planes_ramas').insert({ nombre, orden, plan_id: planId, resumen }).select('id').single()),
    crearSeccion: async ({ estado, orden, planId, ramaId, resumen, titulo }: { estado: 'detallada' | 'solo_titulo'; orden: number; planId: string; ramaId?: string; resumen: string; titulo: string }) =>
      exigirFila(await clienteServidor.from('planes_secciones').insert({
        detallada_en: estado === 'detallada' ? new Date().toISOString() : null,
        estado,
        orden,
        plan_id: planId,
        rama_id: ramaId ?? null,
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
    eliminarSeccionesDeRama: async ({ ramaId }: { ramaId: string }) => {
      const resultado = await clienteServidor.from('planes_secciones').delete().eq('rama_id', ramaId);
      if (resultado.error) throw new Error(resultado.error.message);
    },
    liberarRama: async ({ ramaId }: { ramaId: string }) => {
      const resultado = await clienteServidor.from('planes_ramas').update({ disponibilidad: null, instancia_id: null }).eq('id', ramaId);
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
    // Atomico por el "is('instancia_id', null)" en el WHERE: si dos pedidos
    // llegan casi juntos para la misma rama, solo uno actualiza una fila —
    // el otro recibe 0 filas y construirPlanDesdePropuesta lo trata como
    // fallo (misma proteccion que ya tenia marcar_item_plan para no pisarse).
    reclamarRama: async ({ disponibilidad, planId, ramaId, resumen, usuarioId }: { disponibilidad: Record<string, number | string>; planId: string; ramaId: string; resumen?: string; usuarioId: string }) => {
      const instanciaFila = await clienteServidor.from('planes_instancias').select('id').eq('plan_id', planId).eq('usuario_id', usuarioId).maybeSingle();
      if (instanciaFila.error || !instanciaFila.data) throw new Error('No tenes una instancia en este plan.');

      const actualizado = await clienteServidor.from('planes_ramas')
        .update({ disponibilidad, instancia_id: instanciaFila.data.id, resumen })
        .eq('id', ramaId)
        .is('instancia_id', null)
        .select('id')
        .maybeSingle();
      if (actualizado.error || !actualizado.data) throw new Error('Esta rama ya fue reclamada.');
      return { id: actualizado.data.id };
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
    .select('id, objetivo, propuesta, rama_id, seccion_id, tipo, disponibilidad')
    .maybeSingle();
  if (propuesta.error) return responder(500, { codigo: 'servidor', mensaje: 'No pudimos preparar tu plan.' });
  if (!propuesta.data) return responder(409, { codigo: 'conflicto', mensaje: 'Esta propuesta ya fue usada, vencio o no existe.' });

  try {
    if (propuesta.data.tipo === 'plan_inicial') {
      const contenido = planInicialPropuestaSchema.safeParse(propuesta.data.propuesta);
      if (!contenido.success) throw new Error('propuesta_invalida');

      const resultado = await construirPlanDesdePropuesta(crearRepositorio(clienteServidor), {
        descripcion: contenido.data.descripcionPlan,
        disponibilidad: propuesta.data.disponibilidad ?? {},
        objetivoOriginal: propuesta.data.objetivo,
        primeraSeccionDias: contenido.data.primeraSeccionDias,
        propuestaId: propuesta.data.id,
        ramas: contenido.data.ramas,
        secciones: contenido.data.secciones,
        tipo: 'plan_inicial',
        titulo: contenido.data.tituloPlan,
        usuarioId: user.id,
      });
      return responder(200, { planId: resultado.planId });
    }

    if (propuesta.data.tipo === 'rama') {
      const contenido = ramaPropuestaSchema.safeParse(propuesta.data.propuesta);
      if (!contenido.success) throw new Error('propuesta_invalida');
      if (!propuesta.data.rama_id) throw new Error('propuesta_invalida');

      const ramaFila = await clienteServidor.from('planes_ramas').select('plan_id').eq('id', propuesta.data.rama_id).maybeSingle();
      if (ramaFila.error || !ramaFila.data) throw new Error('propuesta_invalida');

      const resultado = await construirPlanDesdePropuesta(crearRepositorio(clienteServidor), {
        descripcionRama: contenido.data.descripcionPlan,
        disponibilidad: propuesta.data.disponibilidad ?? {},
        planId: ramaFila.data.plan_id,
        primeraSeccionDias: contenido.data.primeraSeccionDias,
        propuestaId: propuesta.data.id,
        ramaId: propuesta.data.rama_id,
        secciones: contenido.data.secciones,
        tipo: 'rama',
        usuarioId: user.id,
      });
      return responder(200, { ramaId: resultado.ramaId });
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
