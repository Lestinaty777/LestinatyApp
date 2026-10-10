import { describe, expect, it } from 'vitest';

import { hueDeHex } from '../senderos/algoritmo/colorHsl';
import { GIRO_FRANJA, tonoDeFranja } from './tonosFranjas';

/** Diferencia de tono en grados, con signo, en el rango (-180, 180]. */
function giro(desde: string, hasta: string): number {
  return Math.round(((hueDeHex(hasta) - hueDeHex(desde) + 540) % 360) - 180);
}

describe('tonoDeFranja', () => {
  const TEMAS = ['#C81E4B', '#01B0CF', '#FCB103']; // crimsonmoon, celesthia, golden

  it('gira el tema 15°, -15° y 30° para mañana, tarde y noche', () => {
    expect(GIRO_FRANJA).toEqual({ manana: 15, tarde: -15, noche: 30 });
    for (const tema of TEMAS) {
      for (const franja of ['manana', 'tarde', 'noche'] as const) {
        expect(Math.abs(giro(tema, tonoDeFranja(tema, franja)) - GIRO_FRANJA[franja])).toBeLessThanOrEqual(2);
      }
    }
  });

  it('las tres franjas dan colores distintos y válidos', () => {
    for (const tema of TEMAS) {
      const colores = (['manana', 'tarde', 'noche'] as const).map((franja) => tonoDeFranja(tema, franja));
      expect(new Set(colores.map((color) => color.toUpperCase())).size).toBe(3);
      for (const color of colores) expect(color).toMatch(/^#[0-9A-Fa-f]{6}$/);
    }
  });
});
