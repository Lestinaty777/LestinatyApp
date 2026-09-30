import { fechaLocalDe } from '../../nucleo/dispositivo/fechaLocal';
import { idDiaDeFecha } from '../habitos/semanaProgramada';

// Mismo cálculo que tareas_es_dia_programado (SQL, ver migración
// 20260930_59): a diferencia de un hábito, una tarea no tiene historial de
// planes — su horario vive directo en la fila, así que no hace falta buscar
// "el plan vigente para esa fecha".
export type FrecuenciaTarea = 'una_vez' | 'dias_semana';

export type ProgramacionTarea = {
  frecuencia: FrecuenciaTarea;
  diasSemana: number[] | null;
  fechaVencimiento: string | null;
};

export function estaProgramadaEnFecha(tarea: ProgramacionTarea, fecha: string | Date): boolean {
  const local = typeof fecha === 'string' ? fecha : fechaLocalDe(fecha);
  if (tarea.frecuencia === 'una_vez') return tarea.fechaVencimiento === local;
  return Boolean(tarea.diasSemana?.includes(idDiaDeFecha(local)));
}

/**
 * Racha actual: días programados consecutivos, contando hacia atrás desde
 * `referencia`, con un registro. Solo tiene sentido para 'dias_semana' — una
 * tarea 'una_vez' no lleva `tareas_registros` (ver tareas.servicio.ts).
 */
export function calcularRachaTarea(tarea: ProgramacionTarea, fechasCompletadas: Set<string>, referencia = new Date()): number {
  if (tarea.frecuencia === 'una_vez') return 0;
  let racha = 0;
  let fecha = fechaLocalDe(referencia);
  // Tope defensivo: nunca debería iterar más de ~un año buscando una racha.
  // Un día NO programado no cuenta ni corta la racha — se salta sin más.
  for (let vueltas = 0; vueltas < 366; vueltas += 1) {
    if (estaProgramadaEnFecha(tarea, fecha)) {
      if (!fechasCompletadas.has(fecha)) break;
      racha += 1;
    }
    const anterior = new Date(`${fecha}T12:00:00`);
    anterior.setDate(anterior.getDate() - 1);
    fecha = fechaLocalDe(anterior);
  }
  return racha;
}
