import type { FranjaConcreta } from '../../compartido/utilidades/franjas';
import { rotarHueHex } from '../senderos/algoritmo/colorHsl';

/**
 * Cuánto se gira el color del tema para dibujar cada franja vacía, en grados
 * de tono. Las tres salen "de la misma familia" que el tema activo —el que la
 * persona eligió en Hoy, o el fijo de cada módulo— pero se distinguen entre
 * sí. Como mucho 30° (pedido del usuario, 2026-10-10).
 */
export const GIRO_FRANJA: Record<FranjaConcreta, number> = { manana: 15, tarde: -15, noche: 30 };

/** Color de una franja a partir del acento del tema activo. */
export function tonoDeFranja(acentoTema: string, franja: FranjaConcreta): string {
  return rotarHueHex(acentoTema, GIRO_FRANJA[franja]);
}
