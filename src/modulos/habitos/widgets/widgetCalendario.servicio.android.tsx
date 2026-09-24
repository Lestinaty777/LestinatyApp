import { Platform } from 'react-native';
import { sincronizarCalendarioNativo, solicitarFijarWidgetCalendarioNativo } from '../../../../modules/habito-widget';
import { obtenerDiasCompletadosMes } from '../habitos.servicio';

/**
 * Sincroniza el widget nativo de calendario (vista de mes, todos los hábitos
 * combinados) — un punto por día donde se cumplió al menos un hábito.
 */
export async function sincronizarWidgetCalendario(): Promise<void> {
  if (Platform.OS !== 'android') return;
  try {
    const resumen = await obtenerDiasCompletadosMes();
    await sincronizarCalendarioNativo(resumen);
  } catch {
    // Si no hay ningún widget de calendario anclado aún, silencioso
  }
}

/** Solicita al sistema anclar el widget de calendario al Launcher. */
export async function pedirAgregarWidgetCalendario(): Promise<boolean> {
  if (Platform.OS !== 'android') return false;
  try {
    return await solicitarFijarWidgetCalendarioNativo();
  } catch {
    return false;
  }
}
