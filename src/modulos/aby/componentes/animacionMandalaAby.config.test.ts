import { describe, expect, it } from 'vitest';

import { crearPulsoFinalMandalaAby } from './animacionMandalaAby.config';

describe('pulsoFinalMandalaAby', () => {
  it('crea un pulso distinto por ciclo que crece antes de desaparecer', () => {
    expect(crearPulsoFinalMandalaAby(0)).toMatchObject({ rotacionFinal: expect.any(Number) });
    const primero = crearPulsoFinalMandalaAby(1);
    const segundo = crearPulsoFinalMandalaAby(2);

    expect(primero.escalaMaxima).toBeGreaterThan(1);
    expect(primero.escalaFinal).toBeLessThan(1);
    expect(primero.rotacionFinal).not.toBe(segundo.rotacionFinal);
    expect(primero.duracionExpansion).not.toBe(segundo.duracionExpansion);
  });
});
