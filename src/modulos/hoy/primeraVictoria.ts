import type { AvanceCategoria } from './adaptadoresHoy';

// La primera victoria de una cuenta: su XP total pasa de 0 a más de 0. El XP
// se calcula desde los registros (migración 83), así que 0 significa "nunca
// completó nada". Solo se celebra si el cambio se ve dentro de esta sesión.

/**
 * `undefined` = todavía cargando: nunca dispara (si no, cada arranque de la app
 * de alguien con XP parecería una primera victoria).
 */
export function detectarPrimeraVictoria(anterior: number | undefined, actual: number | undefined, yaDisparada: boolean): boolean {
  if (yaDisparada || anterior === undefined || actual === undefined) return false;
  return anterior === 0 && actual > 0;
}

export type TipoPrimeraVictoria = 'habito' | 'tarea' | 'rutina' | 'desconocido';

/** Qué fue lo primero que se completó, según el avance del día. Con varios a la vez manda la rutina (contiene a los otros). */
export function tipoDePrimeraVictoria(avance: { habitos: AvanceCategoria; tareas: AvanceCategoria; rutinas: AvanceCategoria }): TipoPrimeraVictoria {
  if (avance.rutinas.hechos > 0) return 'rutina';
  if (avance.habitos.hechos > 0) return 'habito';
  if (avance.tareas.hechos > 0) return 'tarea';
  return 'desconocido';
}
