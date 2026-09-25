import { etiquetarUsuarioNotificaciones, notificacionesListas, registrarResultadoNotificaciones } from '../../nucleo/notificaciones/oneSignal';
import { etiquetasDeRegistro, resultadosDeRegistro } from './senalesNotificacion';
import type { ResultadoRegistroHabito } from './tipos';

// El nivel más alto visto en esta sesión: la etiqueta nivel_max nunca baja
// aunque se registre progreso en un hábito de nivel menor.
let nivelMaxConocido = 0;

export function recordarNivelMaxNotificaciones(nivel: number) {
  nivelMaxConocido = Math.max(nivelMaxConocido, nivel);
}

const ESPERA_SINCRONIZACION_MS = 2500;
let sincronizacionPendiente: ReturnType<typeof setTimeout> | null = null;

/**
 * Recalcula el perfil completo (hábitos activos, mejor racha, nivel máximo)
 * poco después de un cambio: los segmentos y journeys de OneSignal reaccionan
 * en el momento, no recién en el próximo inicio de sesión. Varias llamadas
 * seguidas se agrupan en una sola consulta. Sin OneSignal listo (tareas en
 * segundo plano, web) no consulta nada.
 */
export function programarSincronizacionEtiquetas() {
  if (!notificacionesListas()) return;
  if (sincronizacionPendiente) clearTimeout(sincronizacionPendiente);
  sincronizacionPendiente = setTimeout(() => {
    sincronizacionPendiente = null;
    // Import diferido: etiquetasHabitos depende del servicio de hábitos, que
    // a su vez importa este módulo.
    void import('./etiquetasHabitos').then((modulo) => modulo.sincronizarEtiquetasHabitos()).catch(() => undefined);
  }, ESPERA_SINCRONIZACION_MS);
}

/**
 * Cuenta a OneSignal un progreso registrado: outcomes (atribuidos a la
 * notificación que lo motivó, si la hubo) y etiquetas de actividad. Mejor
 * esfuerzo: nunca lanza ni demora el registro.
 */
export function reportarRegistroANotificaciones(resultado: ResultadoRegistroHabito) {
  try {
    for (const { nombre, valor } of resultadosDeRegistro(resultado)) registrarResultadoNotificaciones(nombre, valor);
    recordarNivelMaxNotificaciones(resultado.nivel || 0);
    etiquetarUsuarioNotificaciones(etiquetasDeRegistro(resultado, new Date(), nivelMaxConocido));
    programarSincronizacionEtiquetas();
  } catch {
    // Medir nunca debe romper el registro.
  }
}
