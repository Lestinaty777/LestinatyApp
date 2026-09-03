import { describe, expect, it } from 'vitest';

import { formasAvanceDescubrimientoAby, intencionesDescubrimientoAby } from './descubrimientoAby';

describe('intencionesDescubrimientoAby', () => {
  it('ofrece seis puertas de entrada para quien no tiene una meta definida', () => {
    expect(intencionesDescubrimientoAby).toHaveLength(6);
    expect(intencionesDescubrimientoAby.map((intencion) => intencion.id)).toEqual([
      'bienestar', 'orden', 'constancia', 'aprendizaje', 'pendiente', 'explorar',
    ]);
  });
});

describe('formasAvanceDescubrimientoAby', () => {
  it('ofrece tres maneras concretas de continuar despues de elegir una intencion', () => {
    expect(formasAvanceDescubrimientoAby.map((forma) => forma.id)).toEqual([
      'pasos-pequenos', 'plan-estructurado', 'explorar-primero',
    ]);
  });
});
