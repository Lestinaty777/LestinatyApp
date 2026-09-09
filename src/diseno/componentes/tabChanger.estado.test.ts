import { describe, expect, it } from 'vitest';

import { resolverIndiceTab } from './tabChanger.estado';

describe('resolverIndiceTab', () => {
  it('prioriza el valor controlado', () => {
    expect(resolverIndiceTab({ value: 0, defaultValue: 1, interno: 1, cantidad: 2 })).toBe(0);
  });

  it('limita los índices fuera de rango', () => {
    expect(resolverIndiceTab({ value: 3, defaultValue: 0, interno: 0, cantidad: 2 })).toBe(1);
  });
});
