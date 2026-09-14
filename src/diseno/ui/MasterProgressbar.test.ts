import { describe, expect, it } from 'vitest';

import { normalizarPorcentaje } from './progreso';

describe('normalizarPorcentaje', () => {
  it('conserva el estado vacío y limita el progreso a la pista visible', () => {
    expect(normalizarPorcentaje(-8)).toBe(0);
    expect(normalizarPorcentaje(0)).toBe(0);
    expect(normalizarPorcentaje(42)).toBe(42);
    expect(normalizarPorcentaje(130)).toBe(100);
  });
});
