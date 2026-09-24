import { describe, expect, it } from 'vitest';

import { calcularHitos } from './hitosMision';

describe('calcularHitos', () => {
  it('con meta=10 da 2/5/8/10', () => {
    const hitos = calcularHitos(10, 0, (v) => `${v}`);
    expect(hitos.map((h) => h.valor)).toEqual([2, 5, 8, 10]);
  });

  it('el último hito siempre es exactamente la meta', () => {
    const hitos = calcularHitos(7, 0, (v) => `${v}`);
    expect(hitos[hitos.length - 1].valor).toBe(7);
  });

  it('marca alcanzado según el valor actual', () => {
    const hitos = calcularHitos(10, 6, (v) => `${v}`);
    expect(hitos.map((h) => h.alcanzado)).toEqual([true, true, false, false]);
  });

  it('metas pequeñas no producen hitos duplicados', () => {
    const hitos = calcularHitos(1, 0, (v) => `${v}`);
    expect(hitos).toEqual([{ alcanzado: false, etiqueta: '1', valor: 1 }]);
  });
});
