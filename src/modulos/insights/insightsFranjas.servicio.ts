import { fechaLocalDe } from '../../nucleo/dispositivo/fechaLocal';
import { obtenerClienteSupabase } from '../../servicios/base-datos/supabase';

export const CLAVE_INSIGHTS_FRANJAS = ['insights', 'franjas'] as const;
const DIAS_VENTANA = 30;

/**
 * Instantes en que se registró algo en los últimos 30 días: hábitos con avance,
 * tareas recurrentes y sesiones de rutina completas. Lectura directa: RLS ya
 * limita a lo propio. Si una de las tres falla, se devuelve lo de las otras.
 */
export async function obtenerMarcasCompletado(referencia = new Date()): Promise<string[]> {
  const supabase = obtenerClienteSupabase();
  const desde = fechaLocalDe(new Date(referencia.getTime() - DIAS_VENTANA * 86400000));
  const [habitos, tareas, rutinas] = await Promise.all([
    supabase.from('habitos_registros').select('registrado_at').gt('valor', 0).gte('fecha_local', desde),
    supabase.from('tareas_registros').select('completada_en').gte('fecha_local', desde),
    supabase.from('rutinas_registros').select('completada_en').not('completada_en', 'is', null).gte('fecha_local', desde),
  ]);
  if (habitos.error && tareas.error && rutinas.error) throw habitos.error;
  const marcas = [
    ...((habitos.data ?? []) as { registrado_at: string | null }[]).map((fila) => fila.registrado_at),
    ...((tareas.data ?? []) as { completada_en: string | null }[]).map((fila) => fila.completada_en),
    ...((rutinas.data ?? []) as { completada_en: string | null }[]).map((fila) => fila.completada_en),
  ];
  return marcas.filter((marca): marca is string => typeof marca === 'string');
}
