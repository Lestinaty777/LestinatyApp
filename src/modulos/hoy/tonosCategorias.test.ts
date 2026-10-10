import { describe, expect, it } from 'vitest';

import { hueDeHex } from '../senderos/algoritmo/colorHsl';
import { GIRO_CATEGORIA, tonosCategorias, type CategoriaHoy } from './tonosCategorias';

/** Diferencia de tono en grados, con signo, en el rango (-180, 180]. */
function giro(desde: string, hasta: string): number {
  const delta = ((hueDeHex(hasta) - hueDeHex(desde) + 540) % 360) - 180;
  return Math.round(delta);
}

describe('tonosCategorias', () => {
  const ROJO = '#C81E4B'; // crimsonmoon
  const AZUL = '#01B0CF'; // celesthia

  it('Hábitos usa el color del tema tal cual', () => {
    expect(tonosCategorias(ROJO).habitos).toBe(ROJO);
    expect(tonosCategorias(AZUL).habitos).toBe(AZUL);
  });

  it('las otras tres son tonos distintos entre sí y distintos del tema', () => {
    for (const tema of [ROJO, AZUL]) {
      const tonos = tonosCategorias(tema);
      expect(new Set(Object.values(tonos).map((color) => color.toUpperCase())).size).toBe(4);
    }
  });

  it('cada una gira el tono lo que indica GIRO_CATEGORIA (con 2° de margen por el redondeo a hex)', () => {
    for (const tema of [ROJO, AZUL]) {
      const tonos = tonosCategorias(tema);
      for (const categoria of ['tareas', 'rutinas', 'metas'] as CategoriaHoy[]) {
        expect(Math.abs(giro(tema, tonos[categoria]) - GIRO_CATEGORIA[categoria])).toBeLessThanOrEqual(2);
      }
    }
  });

  it('se quedan cerca del tema: ningún giro pasa de 30°', () => {
    expect(GIRO_CATEGORIA).toEqual({ habitos: 0, tareas: 15, rutinas: -15, metas: 30 });
    expect(Math.max(...Object.values(GIRO_CATEGORIA).map(Math.abs))).toBeLessThanOrEqual(30);
  });

  it('devuelve colores hex válidos', () => {
    for (const color of Object.values(tonosCategorias(ROJO))) expect(color).toMatch(/^#[0-9A-Fa-f]{6}$/);
  });
});
