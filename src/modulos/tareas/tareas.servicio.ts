import { obtenerClienteSupabase } from '../../servicios/base-datos/supabase';
import { fechaLocalDe, fechaLocalHoy } from '../../nucleo/dispositivo/fechaLocal';
import { mapearTransicionSendero } from '../habitos/senderoHabito.mapper';
import { asignarSemillaTarea } from '../tienda/gemas.servicio';
import { mapearFigurasTarea, mapearFiguraTareaPendiente, mapearResultadoGuardarFiguraTarea } from './figuraTarea.mapper';
import { mapearPanelTareas } from './tareas.mapper';
import { calcularRachaTarea, estaProgramadaEnFecha } from './tareaProgramada';
import type {
  CrearTareaInput, EditarTareaInput, EstadoTarea, FiguraTareaNodo, FrecuenciaTarea, MejorRachaTarea, PanelTareas,
  PlanTareaResumen, ResultadoCompletarTarea, ResultadoGuardarFiguraTarea, ResultadoProgresoTareaUnica, ResultadoRegistroTarea, SubitemTarea, Tarea, TareaHoyDetalle, TipoTarea, TrazoFigura,
} from './tareas.tipos';

// A diferencia de hábitos (que pasa todo por RPCs porque tiene reglas de
// servidor: niveles, mandalas, gemas), Tareas es CRUD simple sin motor de
// progresión — RLS (tareas_items_propias) ya garantiza que cada quien solo
// lea/escriba lo suyo, así que el cliente opera directo sobre la tabla, igual
// que ya hace habitos_items en el resto de la app (ver policy espejo). Las
// dos excepciones son RPC: "asignar una semilla" (toca el inventario
// compartido con hábitos) y "completar/descompletar un día" (calcula racha y
// acredita gemas en el servidor — ver migración 20260930_59).

const VENTANA_RACHA_DIAS = 130;

type FilaTarea = {
  id: string;
  titulo: string;
  descripcion: string | null;
  estado: EstadoTarea;
  tipo: TipoTarea;
  prioridad: Tarea['prioridad'];
  columna_kanban: string | null;
  fecha_vencimiento: string | null;
  frecuencia: FrecuenciaTarea;
  dias_semana: number[] | null;
  recordatorio_activo: boolean;
  hora_recordatorio: string | null;
  mostrar_nombre_notificacion: boolean;
  routine_id: string | null;
  paquete_id: string | null;
  color: string | null;
  icono_lucide: string | null;
  orden: number;
  created_at: string;
  completada_en: string | null;
  nivel: number;
  nivel_desde_fecha: string;
  objetivo_valor: number;
  unidad: string | null;
};

function normalizar(fila: FilaTarea): Tarea {
  return {
    id: fila.id,
    titulo: fila.titulo,
    descripcion: fila.descripcion,
    estado: fila.estado,
    tipo: fila.tipo,
    prioridad: fila.prioridad,
    columnaKanban: fila.columna_kanban,
    fechaVencimiento: fila.fecha_vencimiento,
    frecuencia: fila.frecuencia,
    diasSemana: fila.dias_semana,
    recordatorioActivo: fila.recordatorio_activo,
    horaRecordatorio: fila.hora_recordatorio,
    mostrarNombreNotificacion: fila.mostrar_nombre_notificacion,
    routineId: fila.routine_id,
    paqueteId: fila.paquete_id,
    color: fila.color,
    iconoLucide: fila.icono_lucide,
    orden: fila.orden,
    creadaEn: fila.created_at,
    completadaEn: fila.completada_en,
    nivel: fila.nivel,
    nivelDesdeFecha: fila.nivel_desde_fecha,
    objetivoValor: Number(fila.objetivo_valor),
    unidad: fila.unidad,
  };
}

const COLUMNAS = 'id, titulo, descripcion, estado, tipo, prioridad, columna_kanban, fecha_vencimiento, frecuencia, dias_semana, recordatorio_activo, hora_recordatorio, mostrar_nombre_notificacion, routine_id, paquete_id, color, icono_lucide, orden, created_at, completada_en, nivel, nivel_desde_fecha, objetivo_valor, unidad';

async function usuarioActualId(): Promise<string> {
  const { data, error } = await obtenerClienteSupabase().auth.getUser();
  if (error) throw error;
  if (!data.user) throw new Error('Necesitas iniciar sesión para ver tus tareas.');
  return data.user.id;
}

export async function obtenerTareas(): Promise<Tarea[]> {
  const { data, error } = await obtenerClienteSupabase()
    .from('tareas_items')
    .select(COLUMNAS)
    .neq('estado', 'archivada')
    .order('orden', { ascending: true })
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data as FilaTarea[]).map(normalizar);
}

export async function obtenerTareaPorId(tareaId: string): Promise<Tarea> {
  const { data, error } = await obtenerClienteSupabase().from('tareas_items').select(COLUMNAS).eq('id', tareaId).single();
  if (error) throw error;
  return normalizar(data as FilaTarea);
}

// Registros de una tarea desde una fecha (inclusive) — usado por el sendero
// de días (Fase 8) para contar días completados del nivel vigente, igual que
// `tareas_contar_dias_completados_nivel` pero del lado del cliente.
type FilaRegistroTarea = { fecha_local: string; valor: number | null };

export async function obtenerRegistrosTareaDesde(tareaId: string, desde: string): Promise<{ fechaLocal: string; valor: number }[]> {
  const { data, error } = await obtenerClienteSupabase().from('tareas_registros').select('fecha_local,valor').eq('tarea_id', tareaId).gte('fecha_local', desde);
  if (error) throw error;
  return (data as FilaRegistroTarea[]).map((fila) => ({ fechaLocal: fila.fecha_local, valor: Number(fila.valor ?? 0) }));
}

export async function crearTarea(input: CrearTareaInput): Promise<Tarea> {
  const usuarioId = await usuarioActualId();
  const frecuencia = input.frecuencia ?? 'una_vez';
  const { data, error } = await obtenerClienteSupabase()
    .from('tareas_items')
    .insert({
      color: input.color ?? null,
      columna_kanban: input.columnaKanban ?? null,
      descripcion: input.descripcion?.trim() || null,
      dias_semana: frecuencia === 'dias_semana' ? input.diasSemana ?? null : null,
      fecha_vencimiento: input.fechaVencimiento ?? null,
      frecuencia,
      hora_recordatorio: input.recordatorioActivo ? input.horaRecordatorio ?? null : null,
      icono_lucide: input.iconoLucide ?? null,
      mostrar_nombre_notificacion: input.mostrarNombreNotificacion ?? true,
      paquete_id: input.paqueteId ?? null,
      prioridad: input.prioridad ?? null,
      recordatorio_activo: input.recordatorioActivo ?? false,
      routine_id: input.routineId ?? null,
      tipo: input.tipo ?? 'simple',
      titulo: input.titulo.trim(),
      usuario_id: usuarioId,
    })
    .select(COLUMNAS)
    .single();
  if (error) throw error;
  return normalizar(data as FilaTarea);
}

export async function editarTarea(tareaId: string, input: EditarTareaInput): Promise<Tarea> {
  const cambios: Record<string, unknown> = {};
  if (input.titulo !== undefined) cambios.titulo = input.titulo.trim();
  if (input.descripcion !== undefined) cambios.descripcion = input.descripcion?.trim() || null;
  if (input.tipo !== undefined) cambios.tipo = input.tipo;
  if (input.prioridad !== undefined) cambios.prioridad = input.prioridad;
  if (input.columnaKanban !== undefined) cambios.columna_kanban = input.columnaKanban;
  if (input.fechaVencimiento !== undefined) cambios.fecha_vencimiento = input.fechaVencimiento;
  if (input.frecuencia !== undefined) cambios.frecuencia = input.frecuencia;
  if (input.diasSemana !== undefined) cambios.dias_semana = input.diasSemana;
  if (input.recordatorioActivo !== undefined) cambios.recordatorio_activo = input.recordatorioActivo;
  if (input.horaRecordatorio !== undefined) cambios.hora_recordatorio = input.horaRecordatorio;
  if (input.mostrarNombreNotificacion !== undefined) cambios.mostrar_nombre_notificacion = input.mostrarNombreNotificacion;
  if (input.routineId !== undefined) cambios.routine_id = input.routineId;

  const { data, error } = await obtenerClienteSupabase().from('tareas_items').update(cambios).eq('id', tareaId).select(COLUMNAS).single();
  if (error) throw error;

  // Si cambió la hora del recordatorio, borra la notificación de HOY que
  // haya quedado encolada con la hora vieja — mismo arreglo que ya tiene
  // actualizar_habito_desde_detalle (ver 20260927_55 y 20260930_60).
  if (input.horaRecordatorio !== undefined) {
    await reprogramarRecordatorioTarea(tareaId).catch(() => undefined);
  }

  return normalizar(data as FilaTarea);
}

export async function archivarTarea(tareaId: string): Promise<void> {
  const { error } = await obtenerClienteSupabase().from('tareas_items').update({ estado: 'archivada' }).eq('id', tareaId);
  if (error) throw error;
}

export async function eliminarTarea(tareaId: string): Promise<void> {
  const { error } = await obtenerClienteSupabase().from('tareas_items').delete().eq('id', tareaId);
  if (error) throw error;
}

export async function reordenarTareas(idsEnOrden: string[]): Promise<void> {
  const cliente = obtenerClienteSupabase();
  await Promise.all(idsEnOrden.map((id, indice) => cliente.from('tareas_items').update({ orden: indice }).eq('id', id)));
}

// ─── Completar/descompletar un día ────────────────────────────────────────
// Un solo RPC para marcar y desmarcar (toca de nuevo el mismo día = deshace):
// 'una_vez' alterna tareas_items.estado; 'dias_semana' hace upsert/delete en
// tareas_registros, recalcula la racha y acredita gemas en hitos de 7 días.
type FilaResultadoCompletarTarea = { id: string; completada: boolean; racha: number | null; gemas_ganadas: number };

export async function completarTareaDia(tareaId: string, fechaLocal: string = fechaLocalHoy(), nota?: string | null): Promise<ResultadoCompletarTarea> {
  const { data, error } = await obtenerClienteSupabase().rpc('completar_tarea_dia', {
    p_fecha_local: fechaLocal,
    p_nota: nota ?? null,
    p_tarea_id: tareaId,
  });
  if (error) throw error;
  const fila = data as FilaResultadoCompletarTarea;
  return { completada: fila.completada, gemasGanadas: Number(fila.gemas_ganadas), id: fila.id, racha: fila.racha === null ? null : Number(fila.racha) };
}

export async function reprogramarRecordatorioTarea(tareaId: string, fechaLocal: string = fechaLocalHoy()): Promise<void> {
  const { error } = await obtenerClienteSupabase().rpc('reprogramar_recordatorio_tarea', { p_fecha_local: fechaLocal, p_tarea_id: tareaId });
  if (error) throw error;
}

// ─── Sendero de días (Fase 8) — registrar progreso de una tarea recurrente
// (tipo simple/contador/cronometro, frecuencia='dias_semana'). Espejo de
// registrarProgresoHabito, con figuraPendiente en vez de mandalaPendiente.
// Rechaza explícitamente checklist/una_vez (ver registrar_progreso_tarea).
type FilaResultadoRegistroTarea = {
  id: string; tarea_id: string; fecha_local: string; valor: number; nota: string | null;
  subio_nivel: boolean; nivel: number; gemas_ganadas: number; transicion_sendero: unknown; figura_pendiente: unknown;
};

export async function registrarProgresoTarea(input: { tareaId: string; fechaLocal: string; valor: number; nota?: string | null }): Promise<ResultadoRegistroTarea> {
  const { data, error } = await obtenerClienteSupabase().rpc('registrar_progreso_tarea', {
    p_fecha_local: input.fechaLocal, p_nota: input.nota ?? null, p_tarea_id: input.tareaId, p_valor: input.valor,
  });
  if (error) throw error;
  const fila = data as FilaResultadoRegistroTarea;
  return {
    fechaLocal: fila.fecha_local,
    figuraPendiente: mapearFiguraTareaPendiente(fila.figura_pendiente),
    gemasGanadas: Number(fila.gemas_ganadas ?? 0),
    id: fila.id,
    nivel: Number(fila.nivel),
    nota: fila.nota,
    subioNivel: fila.subio_nivel,
    tareaId: fila.tarea_id,
    transicionSendero: mapearTransicionSendero(fila.transicion_sendero),
    valor: Number(fila.valor),
  };
}

// Contraparte de registrarProgresoTarea para contador/cronómetro 'una_vez' —
// el progreso vive en tareas_items.valor_actual, no en tareas_registros (no
// hay "por día" para algo que pasa una sola vez). Sin niveles, sin figuras,
// sin gemas — registrar_progreso_tarea_unica rechaza cualquier tarea
// 'dias_semana' (esa usa registrar_progreso_tarea de arriba).
export async function registrarProgresoTareaUnica(tareaId: string, valor: number): Promise<ResultadoProgresoTareaUnica> {
  const { data, error } = await obtenerClienteSupabase().rpc('registrar_progreso_tarea_unica', { p_tarea_id: tareaId, p_valor: valor });
  if (error) throw error;
  const fila = data as { id: string; valor_actual: number; objetivo_valor: number; completada: boolean };
  return { completada: fila.completada, id: fila.id, objetivoValor: Number(fila.objetivo_valor), valorActual: Number(fila.valor_actual) };
}

// ─── Creación premium (Fase 8) — espejo de crearHabito/crear_habito_premium.
// Reemplaza al insert directo de crearTarea solo en el wizard nuevo
// (CrearTareaWizard.tsx, Fase 8.5); crearTarea/editarTarea no se tocan.
export type CrearTareaPremiumInput = {
  titulo: string;
  descripcion?: string | null;
  iconoLucide?: string | null;
  color?: string | null;
  tipo: TipoTarea;
  objetivoValor?: number;
  unidad?: string | null;
  prioridad?: Tarea['prioridad'];
  frecuencia?: FrecuenciaTarea;
  diasSemana?: number[] | null;
  fechaVencimiento?: string | null;
  recordatorioActivo?: boolean;
  horaRecordatorio?: string | null;
  mostrarNombreNotificacion?: boolean;
  paqueteId?: string | null;
  nivelInicial?: number;
};

export async function crearTareaPremium(input: CrearTareaPremiumInput): Promise<{ id: string }> {
  const { data, error } = await obtenerClienteSupabase().rpc('crear_tarea_premium', {
    p_color: input.color ?? null,
    p_descripcion: input.descripcion ?? null,
    p_dias_semana: input.frecuencia === 'dias_semana' ? input.diasSemana ?? null : null,
    p_fecha_vencimiento: input.fechaVencimiento ?? null,
    p_frecuencia: input.frecuencia ?? 'una_vez',
    p_hora_recordatorio: input.recordatorioActivo ? input.horaRecordatorio ?? null : null,
    p_icono_lucide: input.iconoLucide ?? null,
    p_mostrar_nombre_notificacion: input.mostrarNombreNotificacion ?? true,
    p_nivel_inicial: input.nivelInicial ?? 1,
    p_objetivo_valor: input.objetivoValor ?? 1,
    p_paquete_id: input.paqueteId ?? null,
    p_prioridad: input.prioridad ?? null,
    p_recordatorio_activo: input.recordatorioActivo ?? false,
    p_tipo: input.tipo,
    p_titulo: input.titulo.trim(),
    p_unidad: input.unidad ?? null,
  });
  if (error) throw error;
  return data as { id: string };
}

// ─── Panel de insights ──────────────────────────────────────────────────
export async function obtenerPanelTareas(fecha?: string): Promise<PanelTareas> {
  const { data, error } = await obtenerClienteSupabase().rpc('obtener_panel_tareas', { p_fecha_referencia: fecha ?? null });
  if (error) throw error;
  return mapearPanelTareas(data as Parameters<typeof mapearPanelTareas>[0]);
}

// ─── Hoy ────────────────────────────────────────────────────────────────
// Sin RPC (igual criterio que obtenerHabitosActivos): RLS ya limita a lo
// propio, así que se lee directo y se calcula acá qué tareas "tocan hoy" y
// cuál es la racha de cada una.
// simple/contador/cronometro con frecuencia='dias_semana' usan el sendero de
// días (registrar_progreso_tarea): "completada" ahí es alcanzar la meta
// numérica, no solo que exista un registro — mismo criterio que la función
// SQL (ver privacidad.registrar_progreso_tarea, v_cumple_meta).
const TIPOS_SENDERO_DIAS: readonly TipoTarea[] = ['simple', 'contador', 'cronometro'];
function usaSenderoDeDias(item: { frecuencia: FrecuenciaTarea; tipo: TipoTarea }): boolean {
  return item.frecuencia === 'dias_semana' && TIPOS_SENDERO_DIAS.includes(item.tipo);
}

export async function obtenerTareasHoy(referencia = new Date()): Promise<TareaHoyDetalle[]> {
  const supabase = obtenerClienteSupabase();
  const hoy = fechaLocalDe(referencia);
  const desdeRacha = fechaLocalDe(new Date(referencia.getTime() - VENTANA_RACHA_DIAS * 86400000));

  const [{ data: items, error: errorItems }, { data: registros, error: errorRegistros }] = await Promise.all([
    supabase.from('tareas_items').select('id,titulo,descripcion,icono_lucide,color,tipo,frecuencia,dias_semana,fecha_vencimiento,prioridad,columna_kanban,objetivo_valor,unidad,estado,valor_actual').neq('estado', 'archivada').order('orden', { ascending: true }),
    supabase.from('tareas_registros').select('tarea_id,fecha_local,valor').gte('fecha_local', desdeRacha).lte('fecha_local', hoy),
  ]);
  if (errorItems) throw errorItems;
  if (errorRegistros) throw errorRegistros;

  type FilaItemHoy = { id: string; titulo: string; descripcion: string | null; icono_lucide: string | null; color: string | null; tipo: TipoTarea; frecuencia: FrecuenciaTarea; dias_semana: number[] | null; fecha_vencimiento: string | null; prioridad: Tarea['prioridad']; columna_kanban: string | null; objetivo_valor: number; unidad: string | null; estado: EstadoTarea; valor_actual: number };
  const todosItems = (items ?? []) as FilaItemHoy[];
  const todosRegistros = (registros ?? []) as { tarea_id: string; fecha_local: string; valor: number | null }[];

  return todosItems
    .filter((item) => estaProgramadaEnFecha({ diasSemana: item.dias_semana, fechaVencimiento: item.fecha_vencimiento, frecuencia: item.frecuencia }, hoy))
    .map((item): TareaHoyDetalle => {
      const registrosTarea = todosRegistros.filter((registro) => registro.tarea_id === item.id);
      const fechasCompletadas = new Set(registrosTarea.map((registro) => registro.fecha_local));
      // 'una_vez' no usa tareas_registros en absoluto — ni completar_tarea_dia
      // (actualiza tareas_items.estado/completada_en directo) ni el progreso
      // de contador/cronómetro (tareas_items.valor_actual, ver
      // registrar_progreso_tarea_unica). Mirar tareas_registros ahí siempre
      // daría 0/falso, sin importar el avance real.
      const valorHoy = item.frecuencia === 'una_vez'
        ? item.valor_actual
        : registrosTarea.find((registro) => registro.fecha_local === hoy)?.valor ?? 0;
      const completada = item.frecuencia === 'una_vez'
        ? item.estado === 'hecha'
        : usaSenderoDeDias(item) ? valorHoy >= item.objetivo_valor : fechasCompletadas.has(hoy);
      return {
        color: item.color,
        columnaKanban: item.columna_kanban,
        completada,
        descripcion: item.descripcion,
        frecuencia: item.frecuencia,
        iconoLucide: item.icono_lucide,
        id: item.id,
        objetivoValor: item.objetivo_valor,
        prioridad: item.prioridad,
        racha: calcularRachaTarea({ diasSemana: item.dias_semana, fechaVencimiento: item.fecha_vencimiento, frecuencia: item.frecuencia }, fechasCompletadas, referencia),
        tipo: item.tipo,
        titulo: item.titulo,
        unidad: item.unidad,
        valorHoy,
      };
    });
}

// ─── Mejor racha (tarjeta tipo RachaCard) ──────────────────────────────────
export async function obtenerTareaMejorRacha(referencia = new Date()): Promise<MejorRachaTarea | null> {
  const supabase = obtenerClienteSupabase();
  const hoy = fechaLocalDe(referencia);
  const desde = fechaLocalDe(new Date(referencia.getTime() - VENTANA_RACHA_DIAS * 86400000));

  const [{ data: items, error: errorItems }, { data: registros, error: errorRegistros }] = await Promise.all([
    supabase.from('tareas_items').select('id,titulo,icono_lucide,color,frecuencia,dias_semana').eq('frecuencia', 'dias_semana').neq('estado', 'archivada'),
    supabase.from('tareas_registros').select('tarea_id,fecha_local').gte('fecha_local', desde).lte('fecha_local', hoy),
  ]);
  if (errorItems) throw errorItems;
  if (errorRegistros) throw errorRegistros;

  type FilaItemRacha = { id: string; titulo: string; icono_lucide: string | null; color: string | null; frecuencia: FrecuenciaTarea; dias_semana: number[] | null };
  const todosItems = (items ?? []) as FilaItemRacha[];
  const todosRegistros = (registros ?? []) as { tarea_id: string; fecha_local: string }[];

  let mejor: MejorRachaTarea | null = null;
  let mejorRacha = 0;
  for (const item of todosItems) {
    const fechasCompletadas = new Set(todosRegistros.filter((registro) => registro.tarea_id === item.id).map((registro) => registro.fecha_local));
    const racha = calcularRachaTarea({ diasSemana: item.dias_semana, fechaVencimiento: null, frecuencia: item.frecuencia }, fechasCompletadas, referencia);
    if (racha > mejorRacha) {
      mejorRacha = racha;
      mejor = { color: item.color, iconoLucide: item.icono_lucide, id: item.id, racha, titulo: item.titulo };
    }
  }
  return mejor;
}

// ─── Recordatorios (lista, mismo espíritu que ListaRecordatoriosHabitos) ───
export async function obtenerResumenRecordatoriosTareas(): Promise<PlanTareaResumen[]> {
  const { data, error } = await obtenerClienteSupabase()
    .from('tareas_items')
    .select('id,titulo,icono_lucide,color,recordatorio_activo,hora_recordatorio')
    .neq('estado', 'archivada')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data as { id: string; titulo: string; icono_lucide: string | null; color: string | null; recordatorio_activo: boolean; hora_recordatorio: string | null }[]).map((fila) => ({
    color: fila.color,
    horaRecordatorio: fila.hora_recordatorio,
    id: fila.id,
    iconoLucide: fila.icono_lucide,
    recordatorioActivo: fila.recordatorio_activo,
    titulo: fila.titulo,
  }));
}

// ─── Checklist (pasos de una tarea tipo 'checklist') ───────────────────────
type FilaSubitem = { id: string; tarea_id: string; titulo: string; hecho: boolean; orden: number };

function normalizarSubitem(fila: FilaSubitem): SubitemTarea {
  return { hecho: fila.hecho, id: fila.id, orden: fila.orden, tareaId: fila.tarea_id, titulo: fila.titulo };
}

// Se llama justo después de crearTarea (tipo='checklist') con los títulos ya
// escritos en el formulario — inserta uno por título, en el mismo orden.
export async function crearSubitemsTarea(tareaId: string, titulos: string[]): Promise<SubitemTarea[]> {
  const filas = titulos.map((titulo, orden) => ({ orden, tarea_id: tareaId, titulo: titulo.trim() })).filter((fila) => fila.titulo.length > 0);
  if (filas.length === 0) return [];
  const { data, error } = await obtenerClienteSupabase().from('tareas_subitems').insert(filas).select('id,tarea_id,titulo,hecho,orden');
  if (error) throw error;
  return (data as FilaSubitem[]).map(normalizarSubitem);
}

export async function obtenerSubitemsTarea(tareaId: string): Promise<SubitemTarea[]> {
  const { data, error } = await obtenerClienteSupabase().from('tareas_subitems').select('id,tarea_id,titulo,hecho,orden').eq('tarea_id', tareaId).order('orden');
  if (error) throw error;
  return (data as FilaSubitem[]).map(normalizarSubitem);
}

// Progreso "X/Y pasos" de varias tareas checklist a la vez (para tarjetas en
// un carrusel, sin pedir los subitems completos de cada una una por una).
export async function obtenerResumenSubitemsTareas(tareaIds: string[]): Promise<Map<string, { completados: number; total: number }>> {
  const resumen = new Map<string, { completados: number; total: number }>();
  if (tareaIds.length === 0) return resumen;
  const { data, error } = await obtenerClienteSupabase().from('tareas_subitems').select('tarea_id,hecho').in('tarea_id', tareaIds);
  if (error) throw error;
  for (const fila of data as { tarea_id: string; hecho: boolean }[]) {
    const actual = resumen.get(fila.tarea_id) ?? { completados: 0, total: 0 };
    actual.total += 1;
    if (fila.hecho) actual.completados += 1;
    resumen.set(fila.tarea_id, actual);
  }
  return resumen;
}

// Sin RPC (a diferencia de completar_tarea_dia): un paso no tiene racha ni
// gemas propias, es un simple toggle sobre su fila — RLS (join contra
// tareas_items) ya garantiza que solo su dueño lo pueda tocar.
export async function completarSubitemTarea(subitemId: string, hecho: boolean): Promise<void> {
  const { error } = await obtenerClienteSupabase().from('tareas_subitems').update({ hecho }).eq('id', subitemId);
  if (error) throw error;
}

// ─── Sendero de días (Fase 8) — guardar/leer la figura trazada ────────────
// Espejo de mandalaNodo.servicio.ts (guardarMandalaRegistro/obtenerMandalasHabito).
export async function guardarFiguraTareaRegistro(registroId: string, trazos: TrazoFigura[]): Promise<ResultadoGuardarFiguraTarea> {
  const { data, error } = await obtenerClienteSupabase().rpc('guardar_figura_tarea_registro', {
    p_registro_id: registroId,
    p_trazos: trazos,
  });
  if (error) throw error;
  return mapearResultadoGuardarFiguraTarea(data);
}

export async function obtenerFigurasTarea(tareaId: string): Promise<FiguraTareaNodo[]> {
  const { data, error } = await obtenerClienteSupabase().rpc('obtener_figuras_tarea', { p_tarea_id: tareaId });
  if (error) throw error;
  return mapearFigurasTarea(data);
}

export { asignarSemillaTarea };
