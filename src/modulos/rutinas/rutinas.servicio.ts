import { fechaLocalDe, fechaLocalHoy } from '../../nucleo/dispositivo/fechaLocal';
import { VENTANA_RACHA_RUTINA_DIAS } from './rachaRutina';
import { obtenerClienteSupabase } from '../../servicios/base-datos/supabase';
import { mapearResultadoCierreRutina, mapearResultadoPasoPropio, mapearRutinas } from './rutinas.mapper';
import { datosARemoto } from './rutinas.remoto';
import type { CrearRutinaInput, ResultadoCierreRutina, ResultadoPasoPropio, Rutina } from './rutinas.tipos';

// Lecturas y escrituras de Rutinas. El estado de cada paso se calcula en el
// servidor (obtener_rutinas_hoy, migración 79); completar pasos de hábito o de
// tarea NO pasa por aquí — usa los servicios de hábitos y tareas.
// Recordatorio y archivado son CRUD simple sobre rutinas_items (RLS).
// La edición pasa por actualizar_rutina (migración 85).

export const CLAVE_RUTINAS = ['rutinas', 'lista'] as const;

export async function obtenerRutinasHoy(): Promise<Rutina[]> {
  const { data, error } = await obtenerClienteSupabase().rpc('obtener_rutinas_hoy', { p_fecha_referencia: fechaLocalHoy() });
  if (error) throw error;
  return mapearRutinas(data);
}

export async function crearRutina(input: CrearRutinaInput): Promise<string> {
  const { data, error } = await obtenerClienteSupabase().rpc('crear_rutina', { p_datos: datosARemoto(input) });
  if (error) throw error;
  const id = (data as { id?: unknown } | null)?.id;
  if (typeof id !== 'string') throw new Error('Rutinas: crear_rutina no devolvió un id.');
  return id;
}

/**
 * Edita una rutina (actualizar_rutina, migración 85). Los pasos que llevan `id`
 * se conservan con sus registros; los que faltan se borran y los nuevos se crean.
 */
export async function actualizarRutina(rutinaId: string, input: CrearRutinaInput): Promise<void> {
  const { error } = await obtenerClienteSupabase().rpc('actualizar_rutina', { p_rutina_id: rutinaId, p_datos: datosARemoto(input) });
  if (error) throw error;
}

export async function completarPasoPropioRutina(pasoId: string, valor: number): Promise<ResultadoPasoPropio> {
  const { data, error } = await obtenerClienteSupabase().rpc('completar_paso_propio_rutina', {
    p_paso_id: pasoId, p_valor: valor, p_fecha_local: fechaLocalHoy(),
  });
  if (error) throw error;
  return mapearResultadoPasoPropio(data);
}

export async function actualizarRecordatorioRutina(rutinaId: string, cambios: { activo: boolean; hora: string | null }): Promise<void> {
  if (cambios.activo && !cambios.hora) throw new Error('Rutinas: un recordatorio activo necesita una hora.');
  const { error } = await obtenerClienteSupabase()
    .from('rutinas_items')
    .update({ recordatorio_activo: cambios.activo, hora_inicio: cambios.hora })
    .eq('id', rutinaId);
  if (error) throw error;
  // El aviso de hoy que aún no salió quedó con la hora vieja: se borra y el
  // siguiente tick del cron lo vuelve a programar (migración 84).
  const { error: errorReprogramar } = await obtenerClienteSupabase().rpc('reprogramar_recordatorio_rutina', { p_rutina_id: rutinaId });
  if (errorReprogramar) throw errorReprogramar;
}

export async function archivarRutina(rutinaId: string): Promise<void> {
  const { error } = await obtenerClienteSupabase()
    .from('rutinas_items')
    .update({ estado: 'archivada', archivada_en: new Date().toISOString() })
    .eq('id', rutinaId);
  if (error) throw error;
}

/** Abre (o conserva) la sesión de hoy; llamar dos veces no cambia la hora de inicio. */
export async function iniciarRutina(rutinaId: string): Promise<void> {
  const { error } = await obtenerClienteSupabase().rpc('iniciar_rutina', { p_rutina_id: rutinaId, p_fecha_local: fechaLocalHoy() });
  if (error) throw error;
}

/** Recalcula en el servidor si la sesión está completa (regla de pasos esenciales) y la cierra si lo está. */
export async function cerrarRutinaDia(rutinaId: string): Promise<ResultadoCierreRutina> {
  const { data, error } = await obtenerClienteSupabase().rpc('cerrar_rutina_dia', { p_rutina_id: rutinaId, p_fecha_local: fechaLocalHoy() });
  if (error) throw error;
  return mapearResultadoCierreRutina(data);
}

export const CLAVE_RACHAS_RUTINAS = ['rutinas', 'rachas'] as const;

/**
 * Sesiones completas recientes (rutinas_registros con completada_en), para la
 * racha de cada rutina. Lectura directa: RLS ya limita a lo propio.
 */
export async function obtenerSesionesCompletasRutinas(referencia = new Date()): Promise<{ rutinaId: string; fechaLocal: string }[]> {
  const desde = fechaLocalDe(new Date(referencia.getTime() - VENTANA_RACHA_RUTINA_DIAS * 86400000));
  const { data, error } = await obtenerClienteSupabase()
    .from('rutinas_registros')
    .select('rutina_id, fecha_local')
    .not('completada_en', 'is', null)
    .gte('fecha_local', desde);
  if (error) throw error;
  return ((data ?? []) as { rutina_id: string; fecha_local: string }[]).map((fila) => ({ rutinaId: fila.rutina_id, fechaLocal: fila.fecha_local }));
}

export const CLAVE_METAS_DE_RUTINAS = ['rutinas', 'metas'] as const;

/**
 * Meta de cada rutina (id de rutina → id de meta o null). obtener_rutinas_hoy
 * no la incluye, y es más simple leerla aparte que cambiar ese RPC.
 */
export async function obtenerMetasDeRutinas(): Promise<Map<string, string | null>> {
  const { data, error } = await obtenerClienteSupabase().from('rutinas_items').select('id, meta_id');
  if (error) throw error;
  return new Map(((data ?? []) as { id: string; meta_id: string | null }[]).map((fila) => [fila.id, fila.meta_id] as const));
}
