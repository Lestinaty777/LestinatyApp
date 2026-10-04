// Franjas del día — spec: docs/superpowers/specs/2026-10-04-franjas-del-dia-design.md
// Espejo de public.franja_de_hora() (SQL, migración 69): si cambia una, cambia la otra.

export type FranjaConcreta = 'manana' | 'tarde' | 'noche';
export type FranjaDia = FranjaConcreta | 'cualquier_momento';
/** Lo que elige el selector de 4 botones: una franja concreta o todo el día. */
export type FiltroFranja = FranjaConcreta | 'todo';

/** Orden en que se muestran las secciones de "Todo". */
export const FRANJAS_ORDEN: readonly FranjaDia[] = ['manana', 'tarde', 'noche', 'cualquier_momento'];
export const FILTROS_FRANJA: readonly FiltroFranja[] = ['manana', 'tarde', 'noche', 'todo'];

/** Hora local de inicio (0–23) de cada franja. La noche llega hasta mananaDesde del día siguiente. */
export type LimitesFranja = { mananaDesde: number; tardeDesde: number; nocheDesde: number };

export const LIMITES_FRANJA_DEFECTO: LimitesFranja = { mananaDesde: 5, tardeDesde: 12, nocheDesde: 19 };

export function franjaDeHora(hora: number, limites: LimitesFranja = LIMITES_FRANJA_DEFECTO): FranjaConcreta {
  if (!Number.isInteger(hora) || hora < 0 || hora > 23) throw new RangeError(`Hora inválida: ${hora}`);
  if (hora >= limites.mananaDesde && hora < limites.tardeDesde) return 'manana';
  if (hora >= limites.tardeDesde && hora < limites.nocheDesde) return 'tarde';
  return 'noche';
}

export function franjaActual(ahora: Date = new Date(), limites: LimitesFranja = LIMITES_FRANJA_DEFECTO): FranjaConcreta {
  return franjaDeHora(ahora.getHours(), limites);
}

const HORA_REGEX = /^([01]\d|2[0-3]):[0-5]\d$/;

/** Sugerencia de franja para una hora "HH:mm"; null si la hora no es válida. */
export function sugerirFranjaPorHora(hora: string, limites: LimitesFranja = LIMITES_FRANJA_DEFECTO): FranjaConcreta | null {
  if (!HORA_REGEX.test(hora)) return null;
  return franjaDeHora(Number(hora.slice(0, 2)), limites);
}

export function limitesValidos(limites: LimitesFranja): boolean {
  const { mananaDesde, tardeDesde, nocheDesde } = limites;
  return [mananaDesde, tardeDesde, nocheDesde].every((hora) => Number.isInteger(hora) && hora >= 0 && hora <= 23)
    && mananaDesde < tardeDesde && tardeDesde < nocheDesde;
}

export function agruparPorFranja<T extends { franja: FranjaDia }>(items: readonly T[]): Record<FranjaDia, T[]> {
  const grupos: Record<FranjaDia, T[]> = { manana: [], tarde: [], noche: [], cualquier_momento: [] };
  for (const item of items) grupos[item.franja].push(item);
  return grupos;
}

/**
 * "Todo" muestra todo; una franja concreta muestra solo lo de esa franja. Lo que
 * no tiene franja (cualquier_momento) aparece únicamente en "Todo".
 */
export function filtrarPorFranja<T extends { franja: FranjaDia }>(items: readonly T[], filtro: FiltroFranja): T[] {
  if (filtro === 'todo') return [...items];
  return items.filter((item) => item.franja === filtro);
}

/** Número que muestra cada botón: lo pendiente de esa franja (en "Todo", lo pendiente de todo). */
export function contarPendientesPorFiltro<T extends { franja: FranjaDia }>(
  items: readonly T[],
  esPendiente: (item: T) => boolean,
): Record<FiltroFranja, number> {
  const conteo: Record<FiltroFranja, number> = { manana: 0, tarde: 0, noche: 0, todo: 0 };
  for (const item of items) {
    if (!esPendiente(item)) continue;
    conteo.todo += 1;
    if (item.franja !== 'cualquier_momento') conteo[item.franja] += 1;
  }
  return conteo;
}
