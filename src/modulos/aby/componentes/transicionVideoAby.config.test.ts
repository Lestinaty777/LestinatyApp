import { describe, expect, it } from 'vitest';

import { transicionVideoAby } from './transicionVideoAby.config';

describe('transicionVideoAby', () => {
  it('define una transicion estatica sin capas de video', () => {
    expect(transicionVideoAby.capasDeVideo).toBe(0);
    expect(transicionVideoAby.duracion).toBeGreaterThan(0);
    expect(transicionVideoAby.escalaEntrada).toBe(1);
    expect(transicionVideoAby.escalaSalida).toBe(1);
  });
});
