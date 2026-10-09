import { Platform } from 'react-native';
import { FunctionsHttpError } from '@supabase/supabase-js';

import { obtenerClienteSupabase } from '../../servicios/base-datos/supabase';
import type {
  CrearPlanManualInput, Disponibilidad, EstadoPlan, EstadoSeccionPlan, ModoPlan, MomentoBloque, ParticipantePlan, Plan, PlanBloque, PlanBloqueItem,
  PlanDia, PlanInstancia, PlanRama, PlanSeccion, PlanSeccionDetalle, PropuestaDia, ResultadoAceptarPropuestaPlan, ResultadoDetallarSeccionPlan,
  ResultadoGenerarPlanInicial, ResultadoMarcarItemPlan, ResumenPlan, TipoItemPlan,
} from './planes.tipos';

// El cliente de invoke() colapsa todo error HTTP en un FunctionsHttpError
// genérico — el código real ('horizon_inactivo', 'tope_mensual', etc.) vive
// en el body de la respuesta, no en el error en sí. Esta clase lo rescata
// para que la UI pueda distinguir "no tenés Horizon" (manda al paywall) de
// cualquier otra falla (solo mostrar el mensaje).
export class ErrorAccesoAby extends Error {
  codigo: string | null;
  constructor(codigo: string | null, mensaje: string) {
    super(mensaje);
    this.codigo = codigo;
  }
}

async function erroAby(error: unknown, mensajePorDefecto: string): Promise<ErrorAccesoAby> {
  if (error instanceof FunctionsHttpError) {
    const cuerpo = await error.context.json().catch(() => null) as { codigo?: string; mensaje?: string } | null;
    return new ErrorAccesoAby(cuerpo?.codigo ?? null, cuerpo?.mensaje ?? mensajePorDefecto);
  }
  return new ErrorAccesoAby(null, mensajePorDefecto);
}

// Planes es su propio módulo, par de Tareas/Hábitos — mismo criterio de
// "CRUD simple" que ya documenta tareas.servicio.ts: RLS resuelve quién
// puede leer/escribir qué, así que el cliente opera directo sobre las tablas
// salvo en los dos casos que SÍ necesitan lógica de servidor: asignar una
// semilla (toca el inventario compartido con Hábitos/Tareas) y marcar un
// ítem (evalúa si TODAS las instancias del plan completaron la sección).

export async function usuarioActualId(): Promise<string> {
  const { data, error } = await obtenerClienteSupabase().auth.getUser();
  if (error) throw error;
  if (!data.user) throw new Error('Necesitas iniciar sesión para ver tus planes.');
  return data.user.id;
}

type FilaPlan = {
  completado_en: string | null;
  created_at: string;
  descripcion: string | null;
  disponibilidad: Disponibilidad | null;
  estado: EstadoPlan;
  fecha_objetivo: string | null;
  id: string;
  modo: ModoPlan;
  objetivo_original: string | null;
  orden: number;
  paquete_id: string | null;
  titulo: string;
  usuario_id: string;
};

const COLUMNAS_PLAN = 'id, titulo, descripcion, objetivo_original, modo, paquete_id, disponibilidad, fecha_objetivo, estado, orden, created_at, completado_en, usuario_id';

function normalizarPlan(fila: FilaPlan): Plan {
  return {
    completadoEn: fila.completado_en,
    creadorId: fila.usuario_id,
    creadoEn: fila.created_at,
    descripcion: fila.descripcion,
    disponibilidad: fila.disponibilidad,
    estado: fila.estado,
    fechaObjetivo: fila.fecha_objetivo,
    id: fila.id,
    modo: fila.modo,
    objetivoOriginal: fila.objetivo_original,
    orden: fila.orden,
    paqueteId: fila.paquete_id,
    titulo: fila.titulo,
  };
}

export async function crearPlanManual(input: CrearPlanManualInput): Promise<Plan> {
  const usuarioId = await usuarioActualId();
  const { data, error } = await obtenerClienteSupabase()
    .from('planes_items')
    .insert({
      descripcion: input.descripcion?.trim() || null,
      fecha_objetivo: input.fechaObjetivo ?? null,
      modo: 'manual',
      titulo: input.titulo.trim(),
      usuario_id: usuarioId,
    })
    .select(COLUMNAS_PLAN)
    .single();
  if (error) throw error;
  const plan = normalizarPlan(data as FilaPlan);

  const instancia = await obtenerClienteSupabase().from('planes_instancias').insert({ es_creador: true, plan_id: plan.id, usuario_id: usuarioId });
  if (instancia.error) throw instancia.error;

  return plan;
}

export async function obtenerPlanes(): Promise<ResumenPlan[]> {
  const [{ data: filas, error }, { data: resumenes, error: errorResumen }] = await Promise.all([
    obtenerClienteSupabase().from('planes_items').select(COLUMNAS_PLAN).neq('estado', 'archivado').order('orden', { ascending: true }).order('created_at', { ascending: false }),
    obtenerClienteSupabase().rpc('obtener_resumen_planes'),
  ]);
  if (error) throw error;
  if (errorResumen) throw errorResumen;

  const resumenPorPlan = new Map((resumenes as { plan_id: string; completadas: number; total: number }[] ?? []).map((fila) => [fila.plan_id, fila]));
  return (filas as FilaPlan[]).map((fila) => {
    const plan = normalizarPlan(fila);
    const resumen = resumenPorPlan.get(plan.id);
    return { ...plan, completadas: Number(resumen?.completadas ?? 0), total: Number(resumen?.total ?? 0) };
  });
}

export async function obtenerPlanPorId(planId: string): Promise<Plan> {
  const { data, error } = await obtenerClienteSupabase().from('planes_items').select(COLUMNAS_PLAN).eq('id', planId).single();
  if (error) throw error;
  return normalizarPlan(data as FilaPlan);
}

export async function editarPlan(planId: string, cambios: { descripcion?: string | null; fechaObjetivo?: string | null; titulo?: string }): Promise<void> {
  const patch: Record<string, unknown> = {};
  if (cambios.titulo !== undefined) patch.titulo = cambios.titulo.trim();
  if (cambios.descripcion !== undefined) patch.descripcion = cambios.descripcion?.trim() || null;
  if (cambios.fechaObjetivo !== undefined) patch.fecha_objetivo = cambios.fechaObjetivo;
  const { error } = await obtenerClienteSupabase().from('planes_items').update(patch).eq('id', planId);
  if (error) throw error;
}

export async function archivarPlan(planId: string): Promise<void> {
  const { error } = await obtenerClienteSupabase().from('planes_items').update({ estado: 'archivado' }).eq('id', planId);
  if (error) throw error;
}

type FilaSeccion = {
  contexto_usuario: string | null;
  detallada_en: string | null;
  estado: EstadoSeccionPlan;
  id: string;
  orden: number;
  plan_id: string;
  rama_id: string | null;
  resumen: string | null;
  titulo: string;
};

function normalizarSeccion(fila: FilaSeccion): PlanSeccion {
  return {
    contextoUsuario: fila.contexto_usuario,
    detalladaEn: fila.detallada_en,
    estado: fila.estado,
    id: fila.id,
    orden: fila.orden,
    planId: fila.plan_id,
    ramaId: fila.rama_id,
    resumen: fila.resumen,
    titulo: fila.titulo,
  };
}

const COLUMNAS_SECCION = 'id, plan_id, rama_id, orden, titulo, resumen, estado, contexto_usuario, detallada_en';

export async function obtenerSeccionesPlan(planId: string): Promise<PlanSeccion[]> {
  const { data, error } = await obtenerClienteSupabase().from('planes_secciones').select(COLUMNAS_SECCION).eq('plan_id', planId).order('orden');
  if (error) throw error;
  return (data as FilaSeccion[]).map(normalizarSeccion);
}

type FilaRama = { disponibilidad: Disponibilidad | null; id: string; instancia_id: string | null; nombre: string; orden: number; plan_id: string; resumen: string | null };

export async function obtenerRamasPlan(planId: string): Promise<PlanRama[]> {
  const { data, error } = await obtenerClienteSupabase().from('planes_ramas').select('id, plan_id, nombre, resumen, orden, instancia_id, disponibilidad').eq('plan_id', planId).order('orden');
  if (error) throw error;
  return (data as FilaRama[]).map((fila) => ({
    disponibilidad: fila.disponibilidad,
    id: fila.id,
    instanciaId: fila.instancia_id,
    nombre: fila.nombre,
    orden: fila.orden,
    planId: fila.plan_id,
    resumen: fila.resumen,
  }));
}

export async function obtenerInstanciaPropia(planId: string): Promise<PlanInstancia | null> {
  const usuarioId = await usuarioActualId();
  const { data, error } = await obtenerClienteSupabase().from('planes_instancias').select('id, plan_id, usuario_id, es_creador').eq('plan_id', planId).eq('usuario_id', usuarioId).maybeSingle();
  if (error) throw error;
  if (!data) return null;
  const fila = data as { id: string; plan_id: string; usuario_id: string; es_creador: boolean };
  return { esCreador: fila.es_creador, id: fila.id, planId: fila.plan_id, usuarioId: fila.usuario_id };
}

type FilaBloqueItem = { id: string; meta_valor: number | null; orden: number; tipo: TipoItemPlan; titulo: string; unidad: string | null };
type FilaBloque = { id: string; momento: MomentoBloque; mensaje_contexto: string | null; planes_bloque_items: FilaBloqueItem[] };
type FilaDia = { id: string; orden: number; titulo: string | null; planes_bloques: FilaBloque[] };
type FilaSeccionDetalle = FilaSeccion & { planes_dias: FilaDia[] };

// Trae la sección con su árbol completo (días→bloques→ítems) en una sola
// consulta anidada, y le mezcla encima el progreso de la instancia dada
// (planes_instancia_progreso) — una segunda consulta chica, más simple que
// forzar ese join dentro del embed anidado de PostgREST.
export async function obtenerDetalleSeccion(seccionId: string, instanciaId: string): Promise<PlanSeccionDetalle> {
  const cliente = obtenerClienteSupabase();
  const [{ data: seccionFila, error }, { data: progresoFilas, error: errorProgreso }] = await Promise.all([
    cliente.from('planes_secciones').select(`${COLUMNAS_SECCION}, planes_dias (id, orden, titulo, planes_bloques (id, momento, mensaje_contexto, planes_bloque_items (id, titulo, orden, tipo, meta_valor, unidad)))`).eq('id', seccionId).single(),
    cliente.from('planes_instancia_progreso').select('bloque_item_id, hecho, nota, valor_actual').eq('instancia_id', instanciaId),
  ]);
  if (error) throw error;
  if (errorProgreso) throw errorProgreso;

  const filasProgreso = progresoFilas as { bloque_item_id: string; hecho: boolean; nota: string | null; valor_actual: number | null }[] ?? [];
  const hechoPorItem = new Map(filasProgreso.filter((fila) => fila.hecho).map((fila) => [fila.bloque_item_id, true]));
  const notaPorItem = new Map(filasProgreso.filter((fila) => fila.nota).map((fila) => [fila.bloque_item_id, fila.nota as string]));
  const valorPorItem = new Map(filasProgreso.filter((fila) => fila.valor_actual !== null).map((fila) => [fila.bloque_item_id, fila.valor_actual as number]));
  const fila = seccionFila as FilaSeccionDetalle;

  const dias: PlanDia[] = [...fila.planes_dias].sort((a, b) => a.orden - b.orden).map((diaFila) => ({
    bloques: diaFila.planes_bloques.map((bloqueFila): PlanBloque => ({
      diaId: diaFila.id,
      id: bloqueFila.id,
      items: [...bloqueFila.planes_bloque_items].sort((a, b) => a.orden - b.orden).map((itemFila): PlanBloqueItem => ({
        bloqueId: bloqueFila.id,
        hecho: hechoPorItem.has(itemFila.id),
        id: itemFila.id,
        metaValor: itemFila.meta_valor,
        nota: notaPorItem.get(itemFila.id) ?? null,
        orden: itemFila.orden,
        tipo: itemFila.tipo,
        titulo: itemFila.titulo,
        unidad: itemFila.unidad,
        valorActual: valorPorItem.get(itemFila.id) ?? null,
      })),
      mensajeContexto: bloqueFila.mensaje_contexto,
      momento: bloqueFila.momento,
    })),
    id: diaFila.id,
    orden: diaFila.orden,
    seccionId: fila.id,
    titulo: diaFila.titulo,
  }));

  return { ...normalizarSeccion(fila), dias };
}

// Para ítems "simple" pasa `hecho`; para "contador"/"cronometro" pasa
// `valor` (el servidor calcula `hecho` comparando contra la meta real del
// ítem — nunca confía en un booleano del cliente para esos casos).
export async function marcarItemPlan(instanciaId: string, bloqueItemId: string, hecho?: boolean, valor?: number, nota?: string): Promise<ResultadoMarcarItemPlan> {
  const { data, error } = await obtenerClienteSupabase().rpc('marcar_item_plan', {
    p_bloque_item_id: bloqueItemId, p_hecho: hecho ?? null, p_instancia_id: instanciaId, p_nota: nota ?? null, p_valor: valor ?? null,
  });
  if (error) throw error;
  const remoto = data as { seccionCompletada: boolean; seccionId: string };
  return { seccionCompletada: remoto.seccionCompletada, seccionId: remoto.seccionId };
}

export async function asignarSemillaPlan(semillaId: string, planId: string): Promise<{ paqueteId: string; planId: string }> {
  const { data, error } = await obtenerClienteSupabase().rpc('asignar_semilla_plan', { p_plan_id: planId, p_semilla_id: semillaId });
  if (error) throw error;
  const remoto = data as { plan_id: string; paquete_id: string };
  return { paqueteId: remoto.paquete_id, planId: remoto.plan_id };
}

// ─── Compartidos (Fase 12) ──────────────────────────────────────────────
// Dueño genera/recupera el código (idempotente); cualquiera se une con él.
export async function generarCodigoInvitacionPlan(planId: string): Promise<string> {
  const { data, error } = await obtenerClienteSupabase().rpc('generar_codigo_invitacion_plan', { p_plan_id: planId });
  if (error) throw error;
  return data as string;
}

export async function unirseAPlan(codigo: string): Promise<{ planId: string; titulo: string }> {
  const { data, error } = await obtenerClienteSupabase().rpc('unirse_a_plan', { p_codigo: codigo });
  if (error) throw error;
  return data as { planId: string; titulo: string };
}

export async function obtenerParticipantesPlan(planId: string): Promise<ParticipantePlan[]> {
  const { data, error } = await obtenerClienteSupabase().rpc('obtener_participantes_plan', { p_plan_id: planId });
  if (error) throw error;
  return (data as ParticipantePlan[]) ?? [];
}

// Alta manual de días/bloques/ítems — mismo molde que recibe la IA
// (PropuestaDia[]), así que una sección se puede armar a mano o con Aby con
// el mismo código de guardado del lado del cliente. No es atómico (son
// varios inserts seguidos, mismo criterio ya aceptado para crearTarea +
// crearSubitemsTarea) — si se corta a mitad de camino, la sección queda
// parcialmente armada y se puede reintentar o borrar, sin tocar plata ni
// estado compartido.
export async function guardarDetalleSeccionManual(seccionId: string, dias: PropuestaDia[]): Promise<void> {
  const cliente = obtenerClienteSupabase();
  for (const [indiceDia, dia] of dias.entries()) {
    const diaInsertado = await cliente.from('planes_dias').insert({ orden: indiceDia, seccion_id: seccionId, titulo: dia.titulo ?? null }).select('id').single();
    if (diaInsertado.error || !diaInsertado.data) throw diaInsertado.error ?? new Error('No se pudo crear el día.');
    for (const bloque of dia.bloques) {
      const bloqueInsertado = await cliente.from('planes_bloques').insert({ dia_id: diaInsertado.data.id, mensaje_contexto: bloque.mensajeContexto, momento: bloque.momento }).select('id').single();
      if (bloqueInsertado.error || !bloqueInsertado.data) throw bloqueInsertado.error ?? new Error('No se pudo crear el bloque.');
      const items = bloque.items.filter((item) => item.titulo.trim().length > 0).map((item, indiceItem) => ({
        bloque_id: bloqueInsertado.data.id,
        meta_valor: item.metaValor ?? null,
        orden: indiceItem,
        tipo: item.tipo,
        titulo: item.titulo.trim(),
        unidad: item.unidad ?? null,
      }));
      if (items.length === 0) continue;
      const itemsInsertados = await cliente.from('planes_bloque_items').insert(items);
      if (itemsInsertados.error) throw itemsInsertados.error;
    }
  }
  const seccionActualizada = await cliente.from('planes_secciones').update({ detallada_en: new Date().toISOString(), estado: 'detallada' }).eq('id', seccionId);
  if (seccionActualizada.error) throw seccionActualizada.error;
}

export async function agregarSeccionManual(planId: string, orden: number, titulo: string, resumen?: string): Promise<PlanSeccion> {
  const { data, error } = await obtenerClienteSupabase().from('planes_secciones').insert({
    estado: 'solo_titulo',
    orden,
    plan_id: planId,
    resumen: resumen?.trim() || null,
    titulo: titulo.trim(),
  }).select(COLUMNAS_SECCION).single();
  if (error) throw error;
  return normalizarSeccion(data as FilaSeccion);
}

// ─── Generación con Aby (Edge Functions) ───────────────────────────────
// Mismo patrón que aby.servicio.ts: invoke + el servidor valida con Zod del
// otro lado, acá solo se castea la forma ya confiada de vuelta.

// Tres formas de llamar, nunca mezcladas: {objetivo, disponibilidad} (modo
// de siempre), {objetivo, cantidadRamas} (crear un plan dividido en N
// ramas, sin disponibilidad — nadie la reclamó todavía), o {ramaId,
// disponibilidad} (reclamar una rama ya existente con la disponibilidad
// real de quien la reclama).
export async function generarPlanInicial(input: { cantidadRamas?: number; contexto?: string; disponibilidad?: Disponibilidad; objetivo?: string; plazoDias?: number; ramaId?: string }): Promise<ResultadoGenerarPlanInicial> {
  const { data, error } = await obtenerClienteSupabase().functions.invoke('generar-plan-inicial', {
    body: {
      cantidadRamas: input.cantidadRamas,
      contexto: input.contexto,
      disponibilidad: input.disponibilidad,
      objetivo: input.objetivo,
      plataforma: Platform.OS,
      plazoDias: input.plazoDias,
      ramaId: input.ramaId,
    },
  });
  if (error) throw await erroAby(error, 'Aby no pudo preparar tu plan. Intentalo de nuevo.');
  return data as ResultadoGenerarPlanInicial;
}

export async function detallarSeccionPlan(seccionId: string, contextoUsuario: string): Promise<ResultadoDetallarSeccionPlan> {
  const { data, error } = await obtenerClienteSupabase().functions.invoke('detallar-seccion-plan', { body: { contextoUsuario, plataforma: Platform.OS, seccionId } });
  if (error) throw await erroAby(error, 'Aby no pudo detallar esta sección. Intentalo de nuevo.');
  return data as ResultadoDetallarSeccionPlan;
}

export async function aceptarPropuestaPlan(propuestaId: string): Promise<ResultadoAceptarPropuestaPlan> {
  const { data, error } = await obtenerClienteSupabase().functions.invoke('aceptar-propuesta-plan', { body: { propuestaId } });
  if (error) throw await erroAby(error, 'No pudimos crear tu plan. Intentalo de nuevo.');
  return data as ResultadoAceptarPropuestaPlan;
}
