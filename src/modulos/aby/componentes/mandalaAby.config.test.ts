import { describe, expect, it } from 'vitest';

import { crearTrazoMandalaAby, trazosMandalaAby } from './mandalaAby.config';

describe('trazosMandalaAby', () => {
  it('define siete pétalos simétricos para el bucle de dibujo', () => {
    expect(trazosMandalaAby).toHaveLength(7);
    expect(new Set(trazosMandalaAby)).toHaveLength(7);
  });

  it('alterna familias de pétalos claramente distintas sin perder simetría radial', () => {
    expect(new Set([0, 1, 2, 3].map(crearTrazoMandalaAby))).toHaveLength(4);
    expect(crearTrazoMandalaAby(1)).toContain('M 80 80');
    expect(crearTrazoMandalaAby(1)).toContain('A ');
  });
});
