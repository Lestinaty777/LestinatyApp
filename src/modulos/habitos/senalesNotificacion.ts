import type { ResultadoRegistroHabito } from './tipos';

// Qué le cuenta la app a OneSignal sobre los hábitos. Nombres estables:
// son los que se usan en el panel para segmentos, mensajes in-app,
// journeys y reportes de outcomes, así que cambiarlos rompe lo configurado.
export const ETIQUETAS = {
  /** Cantidad de hábitos activos (0 = todavía no creó ninguno). */
  habitosActivos: 'habitos_activos',
  /** Mejor racha actual entre sus hábitos, en días. */
  rachaMax: 'racha_max',
  /** Unix (segundos) del último progreso registrado: segmentos por inactividad. */
  ultimoRegistro: 'ultimo_registro',
  /** Nivel de sendero más alto alcanzado (1–7). */
  nivelMax: 'nivel_max',
} as const;

export const RESULTADOS = {
  /** Cualquier progreso registrado. */
  progreso: 'progreso_registrado',
  /** Un día del sendero completado (se ganó su mandala). */
  diaCompletado: 'dia_completado',
  /** Subió de nivel o cerró un ciclo del sendero. */
  nivelSubido: 'nivel_subido',
  /** Gemas ganadas, con su cantidad como valor. */
  gemas: 'gemas_ganadas',
} as const;

export type ResultadoNotificacion = { nombre: string; valor?: number };

export function unixSegundos(fecha: Date) {
  return String(Math.floor(fecha.getTime() / 1000));
}

// Un día cuenta como completado cuando el servidor abre su mandala
// (mandalaPendiente) o cierra el tramo del sendero (transicionSendero): el
// registro parcial de un hábito de cantidad o duración no llega a ninguno.
export function resultadosDeRegistro(resultado: ResultadoRegistroHabito): ResultadoNotificacion[] {
  const resultados: ResultadoNotificacion[] = [{ nombre: RESULTADOS.progreso }];
  if (resultado.mandalaPendiente || resultado.transicionSendero) resultados.push({ nombre: RESULTADOS.diaCompletado });
  if (resultado.subioNivel || resultado.transicionSendero) resultados.push({ nombre: RESULTADOS.nivelSubido });
  if (resultado.gemasGanadas > 0) resultados.push({ nombre: RESULTADOS.gemas, valor: resultado.gemasGanadas });
  return resultados;
}

export function etiquetasDeRegistro(resultado: ResultadoRegistroHabito, ahora: Date, nivelMaxConocido = 0): Record<string, string> {
  return {
    [ETIQUETAS.ultimoRegistro]: unixSegundos(ahora),
    [ETIQUETAS.nivelMax]: String(Math.max(nivelMaxConocido, resultado.nivel || 0)),
  };
}

export function etiquetasDePerfil(entrada: { habitosActivos: number; rachaMax: number; nivelMax: number }): Record<string, string> {
  return {
    [ETIQUETAS.habitosActivos]: String(entrada.habitosActivos),
    [ETIQUETAS.nivelMax]: String(entrada.nivelMax),
    [ETIQUETAS.rachaMax]: String(entrada.rachaMax),
  };
}
