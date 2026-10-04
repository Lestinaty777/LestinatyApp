// Fase 11 — a diferencia del sendero de días de Tareas (Fase 8), un Plan no
// necesita el motor de niveles de senderoNiveles.ts: ese motor modela ciclos
// infinitos de maestría (DIAS_POR_MAPA/42 días) para algo recurrente, y un
// Plan es lo opuesto, un proyecto finito con una sola meta de llegada. El
// nivel es una función pura y trivial de dos conteos, sin columna propia ni
// servidor involucrado.
export function calcularNivelPlan(completadas: number, total: number): number {
  if (total <= 0) return 1;
  const proporcion = completadas / total;
  return Math.min(7, Math.max(1, Math.ceil(proporcion * 7)));
}

export type RitmoPlan = 'a_tiempo' | 'adelantado' | 'atrasado' | 'sin_fecha';

// Compara % de tareas completadas contra % de tiempo transcurrido hasta
// fechaObjetivo — sin fecha, o con 0 ítems, no hay ritmo que mostrar. Margen
// de 10 puntos antes de considerar "atrasado"/"adelantado" para no marcar
// como fuera de ritmo apenas pasan unas horas.
export function calcularRitmoPlan(input: {
  completadas: number;
  creadoEn: string;
  fechaObjetivo: string | null;
  total: number;
}): RitmoPlan {
  if (!input.fechaObjetivo || input.total <= 0) return 'sin_fecha';
  const inicio = new Date(input.creadoEn).getTime();
  const fin = new Date(input.fechaObjetivo).getTime();
  if (!Number.isFinite(inicio) || !Number.isFinite(fin) || fin <= inicio) return 'sin_fecha';

  const progresoTiempo = Math.min(1, Math.max(0, (Date.now() - inicio) / (fin - inicio)));
  const progresoTareas = input.completadas / input.total;
  const diferencia = progresoTareas - progresoTiempo;

  if (diferencia > 0.1) return 'adelantado';
  if (diferencia < -0.1) return 'atrasado';
  return 'a_tiempo';
}
