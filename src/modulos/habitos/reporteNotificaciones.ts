import { etiquetarUsuarioNotificaciones, registrarResultadoNotificaciones } from '../../nucleo/notificaciones/oneSignal';
import { etiquetasDeRegistro, resultadosDeRegistro } from './senalesNotificacion';
import type { ResultadoRegistroHabito } from './tipos';

// El nivel más alto visto en esta sesión: la etiqueta nivel_max nunca baja
// aunque se registre progreso en un hábito de nivel menor.
let nivelMaxConocido = 0;

export function recordarNivelMaxNotificaciones(nivel: number) {
  nivelMaxConocido = Math.max(nivelMaxConocido, nivel);
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
  } catch {
    // Medir nunca debe romper el registro.
  }
}
