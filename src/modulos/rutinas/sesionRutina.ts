import type { PasoRutina } from './rutinas.tipos';

// Lógica pura de la sesión guiada. Spec: docs/superpowers/specs/2026-10-05-sesion-guiada-rutinas-design.md

/** Tiempos disponibles que se ofrecen antes de empezar; null = completa. */
export const OPCIONES_MINUTOS_SESION = [30, 15, 5] as const;

/** Estimación v1 de lo que dura un paso (los pasos no guardan una duración propia). */
export function minutosEstimadosPaso(paso: Pick<PasoRutina, 'modo' | 'objetivoValor'>): number {
  if (paso.modo === 'cronometro' && paso.objetivoValor != null && paso.objetivoValor > 0) return Math.max(1, Math.ceil(paso.objetivoValor));
  if (paso.modo === 'contador' || paso.modo === 'checklist') return 5;
  if (paso.modo === 'cronometro') return 5;
  return 2;
}

export type PlanSesion = {
  /** Pasos de la sesión, en el orden original de la rutina. */
  pasos: PasoRutina[];
  /** Pasos pendientes que no caben en el tiempo elegido. */
  omitidos: PasoRutina[];
  minutosTotal: number;
  /** Solo los esenciales ya pasan del tiempo elegido (se hacen igual, pero se avisa). */
  excede: boolean;
};

/**
 * Arma la sesión con lo que falta por hacer hoy. Siempre entran los pasos
 * requeridos (esenciales; si ninguno aplica hoy, todos); los opcionales entran,
 * en orden, mientras quepan en `minutosDisponibles`. Con null entra todo.
 */
export function planearSesion(pasos: readonly PasoRutina[], minutosDisponibles: number | null): PlanSesion {
  const pendientes = [...pasos].filter((paso) => paso.aplica && !paso.completo).sort((a, b) => a.orden - b.orden);
  if (minutosDisponibles === null) {
    return { pasos: pendientes, omitidos: [], minutosTotal: sumarMinutos(pendientes), excede: false };
  }
  const hayEsencialesAplicables = pasos.some((paso) => paso.aplica && paso.esencial);
  const esRequerido = (paso: PasoRutina) => (hayEsencialesAplicables ? paso.esencial : true);

  const incluidos = new Set(pendientes.filter(esRequerido).map((paso) => paso.id));
  let total = sumarMinutos(pendientes.filter(esRequerido));
  const excede = total > minutosDisponibles;
  for (const paso of pendientes) {
    if (incluidos.has(paso.id)) continue;
    const minutos = minutosEstimadosPaso(paso);
    if (total + minutos <= minutosDisponibles) {
      incluidos.add(paso.id);
      total += minutos;
    }
  }
  return {
    pasos: pendientes.filter((paso) => incluidos.has(paso.id)),
    omitidos: pendientes.filter((paso) => !incluidos.has(paso.id)),
    minutosTotal: total,
    excede,
  };
}

function sumarMinutos(pasos: readonly PasoRutina[]): number {
  return pasos.reduce((suma, paso) => suma + minutosEstimadosPaso(paso), 0);
}

/** Segundos que faltan hasta `finMs` (nunca negativo, redondeado hacia arriba para no mostrar 0:00 antes de tiempo). */
export function segundosRestantes(finMs: number, ahoraMs: number): number {
  return Math.max(0, Math.ceil((finMs - ahoraMs) / 1000));
}

/** 305 -> "5:05"; 3725 -> "1:02:05". */
export function formatoReloj(segundos: number): string {
  const total = Math.max(0, Math.floor(segundos));
  const horas = Math.floor(total / 3600);
  const minutos = Math.floor((total % 3600) / 60);
  const resto = String(total % 60).padStart(2, '0');
  return horas > 0 ? `${horas}:${String(minutos).padStart(2, '0')}:${resto}` : `${minutos}:${resto}`;
}

export type AccionCompletarExterno =
  | { accion: 'habito'; valor: number }
  | { accion: 'completar_tarea_dia' }
  | { accion: 'registrar_progreso_tarea'; valor: number }
  | { accion: 'registrar_progreso_tarea_unica'; valor: number };

/**
 * Qué RPC completa un paso que referencia un hábito o una tarea, marcando la meta
 * completa (igual que el atajo del círculo en Hoy). Para tareas sigue la tabla de
 * ruteo de src/modulos/tareas/README.md. Devuelve null si el paso es propio.
 */
export function resolverCompletadoExterno(paso: Pick<PasoRutina, 'origen' | 'objetivoValor' | 'tareaTipo' | 'tareaFrecuencia'>): AccionCompletarExterno | null {
  if (paso.origen === 'habito') return { accion: 'habito', valor: paso.objetivoValor ?? 1 };
  if (paso.origen !== 'tarea') return null;
  const { tareaTipo: tipo, tareaFrecuencia: frecuencia } = paso;
  const valor = paso.objetivoValor ?? 1;
  if (tipo === 'checklist' || tipo === null || frecuencia === null) return { accion: 'completar_tarea_dia' };
  if (frecuencia === 'dias_semana') return { accion: 'registrar_progreso_tarea', valor: tipo === 'simple' ? 1 : valor };
  if (tipo === 'simple') return { accion: 'completar_tarea_dia' };
  return { accion: 'registrar_progreso_tarea_unica', valor };
}
