import { mapaNivel1 } from './mapaNivel1';
import { mapaNivel2 } from './mapaNivel2';
import { mapaNivel3 } from './mapaNivel3';
import { mapaNivel4 } from './mapaNivel4';
import { mapaNivel5 } from './mapaNivel5';
import { mapaNivel6 } from './mapaNivel6';
import { mapaNivel7 } from './mapaNivel7';

export type { DefinicionMapaNivel } from './tipos';
export { mapaNivel1, mapaNivel2, mapaNivel3, mapaNivel4, mapaNivel5, mapaNivel6, mapaNivel7 };

/** Los 7 mapas en orden de nivel (índice 0 = nivel 1). */
export const MAPAS_NIVELES = [mapaNivel1, mapaNivel2, mapaNivel3, mapaNivel4, mapaNivel5, mapaNivel6, mapaNivel7];

/** Lookup directo por número de nivel (1-7). */
export const MAPAS_POR_NIVEL: Record<number, (typeof MAPAS_NIVELES)[number]> = Object.fromEntries(
  MAPAS_NIVELES.map((mapa) => [mapa.nivel, mapa]),
);

export function obtenerMapaNivel(nivel: number) {
  return MAPAS_POR_NIVEL[nivel];
}
