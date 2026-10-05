import { fechaLocalHoy } from '../../nucleo/dispositivo/fechaLocal';
import { obtenerClienteSupabase } from '../../servicios/base-datos/supabase';
import { mapearResultadoCierreRutina, mapearResultadoPasoPropio, mapearRutinas } from './rutinas.mapper';
import type { CrearRutinaInput, PasoNuevoRutina, ResultadoCierreRutina, ResultadoPasoPropio, Rutina } from './rutinas.tipos';

// Lecturas y escrituras de Rutinas. El estado de cada paso se calcula en el
// servidor (obtener_rutinas_hoy, migración 71); completar pasos de hábito o de
// tarea NO pasa por aquí — usa los servicios de hábitos y tareas.
// Recordatorio y archivado son CRUD simple sobre rutinas_items (RLS).

export const CLAVE_RUTINAS = ['rutinas', 'lista'] as const;

export async function obtenerRutinasHoy(): Promise<Rutina[]> {
  const { data, error } = await obtenerClienteSupabase().rpc('obtener_rutinas_hoy', { p_fecha_referencia: fechaLocalHoy() });
  if (error) throw error;
  return mapearRutinas(data);
}

function pasoARemoto(paso: PasoNuevoRutina) {
  const esencial = paso.esencial ?? true;
  if (paso.origen === 'habito') return { tipo_origen: 'habito', habito_id: paso.habitoId, esencial };
  if (paso.origen === 'tarea') return { tipo_origen: 'tarea', tarea_id: paso.tareaId, esencial };
  return {
    tipo_origen: 'propio', titulo: paso.titulo, modo: paso.modo, esencial,
    objetivo_valor: paso.modo === 'simple' ? null : paso.objetivoValor ?? null, unidad: paso.unidad ?? null,
  };
}

export async function crearRutina(input: CrearRutinaInput): Promise<string> {
  const { data, error } = await obtenerClienteSupabase().rpc('crear_rutina', {
    p_datos: {
      titulo: input.titulo.trim(),
      descripcion: input.descripcion ?? null,
      franja: input.franja,
      icono_lucide: input.iconoLucide,
      color: input.color,
      frecuencia: input.frecuencia,
      dias_semana: input.frecuencia === 'dias_semana' ? input.diasSemana ?? null : null,
      hora_inicio: input.horaInicio ?? null,
      recordatorio_activo: input.recordatorioActivo ?? false,
      mostrar_nombre_notificacion: input.mostrarNombreNotificacion ?? true,
      pasos: input.pasos.map(pasoARemoto),
    },
  });
  if (error) throw error;
  const id = (data as { id?: unknown } | null)?.id;
  if (typeof id !== 'string') throw new Error('Rutinas: crear_rutina no devolvió un id.');
  return id;
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
