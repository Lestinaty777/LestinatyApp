import { fechaLocalHoy } from '../../nucleo/dispositivo/fechaLocal';
import { obtenerClienteSupabase } from '../../servicios/base-datos/supabase';
import { mapearResumenHoy, type ResumenHoy } from './resumenHoy.mapper';

export const CLAVE_RESUMEN_HOY = ['hoy', 'resumen'] as const;

/** Racha global, días activos de la semana y XP total (calculados en el servidor, migración 83). */
export async function obtenerResumenHoy(): Promise<ResumenHoy> {
  const { data, error } = await obtenerClienteSupabase().rpc('obtener_resumen_hoy', { p_fecha_referencia: fechaLocalHoy() });
  if (error) throw error;
  return mapearResumenHoy(data);
}
