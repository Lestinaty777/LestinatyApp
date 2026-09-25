import { etiquetarUsuarioNotificaciones } from '../../nucleo/notificaciones/oneSignal';
import { obtenerClienteSupabase } from '../../servicios/base-datos/supabase';
import { obtenerHabitoMejorRacha, obtenerHabitosActivos } from './habitos.servicio';
import { recordarNivelMaxNotificaciones } from './reporteNotificaciones';
import { etiquetasDePerfil } from './senalesNotificacion';

async function nivelMaxAlcanzado(): Promise<number> {
  const { data, error } = await obtenerClienteSupabase().from('habitos_planes').select('nivel').order('nivel', { ascending: false }).limit(1);
  if (error) throw error;
  return Number(data?.[0]?.nivel ?? 0);
}

/**
 * Al iniciar sesión, deja en OneSignal el perfil de hábitos del usuario
 * (hábitos activos, mejor racha, nivel máximo) para segmentar y disparar
 * mensajes in-app desde el panel. Mejor esfuerzo.
 */
export async function sincronizarEtiquetasHabitos(): Promise<void> {
  const [activos, mejorRacha, nivelMax] = await Promise.all([
    obtenerHabitosActivos(),
    obtenerHabitoMejorRacha(),
    nivelMaxAlcanzado().catch(() => 0),
  ]);
  recordarNivelMaxNotificaciones(nivelMax);
  etiquetarUsuarioNotificaciones(etiquetasDePerfil({ habitosActivos: activos.length, nivelMax, rachaMax: mejorRacha?.racha ?? 0 }));
}
