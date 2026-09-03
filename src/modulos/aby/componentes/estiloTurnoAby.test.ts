import { describe, expect, it } from 'vitest';

import { obtenerEstiloTurnoAby } from './estiloTurnoAby';

describe('obtenerEstiloTurnoAby', () => {
  it('usa negro sin categoria y conserva el acento de la categoria', () => {
    expect(obtenerEstiloTurnoAby(null).acento).toBe('#141414');
    expect(obtenerEstiloTurnoAby('rutinas').acento).toBe('#4F9EEB');
    expect(obtenerEstiloTurnoAby('salud').acento).toBe('#4FAE63');
  });
});
