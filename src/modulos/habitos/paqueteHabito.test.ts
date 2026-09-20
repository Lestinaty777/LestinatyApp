import { describe, expect, it } from 'vitest';

import { resolverPaqueteHabito } from './paqueteHabito';

describe('resolverPaqueteHabito', () => {
  it('asigna Esmeralda al hábito que no tiene paquete o conserva un id legado', () => {
    expect(resolverPaqueteHabito()).toBe('esmeralda');
    expect(resolverPaqueteHabito('verde-1')).toBe('esmeralda');
  });

  it('conserva el paquete de una semilla asignada', () => {
    expect(resolverPaqueteHabito('Mathist')).toBe('mathist');
  });
});
