import { obtenerClienteSupabase } from '../../servicios/base-datos/supabase';
import { mapearResultadoReclamoTarea, mapearResumenTareasDiarias } from './tareasDiarias.mapper';
import type { CodigoTareaDiaria, ResultadoReclamoTarea, ResumenTareasDiarias } from './tareasDiarias.tipos';

export async function obtenerTareasDiarias(): Promise<ResumenTareasDiarias> {
  const { data, error } = await obtenerClienteSupabase().rpc('obtener_tareas_diarias');
  if (error) throw error;
  return mapearResumenTareasDiarias(data);
}

export async function reclamarTareaDiaria(codigo: CodigoTareaDiaria): Promise<ResultadoReclamoTarea> {
  const { data, error } = await obtenerClienteSupabase().rpc('reclamar_tarea_diaria', { p_tarea_codigo: codigo });
  if (error) throw error;
  return mapearResultadoReclamoTarea(data);
}
