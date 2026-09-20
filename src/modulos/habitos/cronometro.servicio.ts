import { Platform } from 'react-native';
import {
  limpiarSesionesPendientesCronometroNativas,
  obtenerSesionesPendientesCronometroNativas,
} from '../../../modules/habito-widget';
import { registrarProgresoHabito } from './habitos.servicio';

/**
 * Registra en Supabase cualquier sesión de cronómetro que el usuario haya
 * finalizado desde el botón "Finalizar" de la notificación (sin una pantalla
 * abierta confirmando el guardado) — mismo patrón offline-first que
 * procesarIncrementosPendientesWidget. Es el ÚNICO lugar que acredita estas
 * sesiones: el evento nativo 'finalizado' es solo aviso de UI, no dispara el
 * registro por sí mismo, para no acreditar la misma sesión dos veces.
 */
export async function sincronizarSesionesCronometroPendientes(): Promise<boolean> {
  if (Platform.OS !== 'android') return false;
  try {
    const pendientes = await obtenerSesionesPendientesCronometroNativas();
    if (!pendientes || pendientes.length === 0) return false;

    for (const sesion of pendientes) {
      try {
        await registrarProgresoHabito({
          fechaLocal: sesion.fechaLocal,
          habitoId: sesion.habitoId,
          valor: sesion.valor,
        });
      } catch {
        // Si falla la red, se reintenta en la siguiente sincronización
      }
    }

    await limpiarSesionesPendientesCronometroNativas();
    return true;
  } catch {
    // silencioso si no hay ninguna sesión de cronómetro nativa activa
    return false;
  }
}
