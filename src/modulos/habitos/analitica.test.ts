import { describe, expect, it } from 'vitest';

import { obtenerEstadoAnalitica, porcentajeProgreso } from './analitica';

describe('analítica de hábitos', () => {
  it('mantiene conexiones en observación antes de siete días comparables', () => {
    expect(obtenerEstadoAnalitica({ comparables: 6, tipo: 'conexiones' })).toBe('en_observacion');
    expect(obtenerEstadoAnalitica({ comparables: 7, tipo: 'conexiones' })).toBe('listo');
  });

  it('limita el porcentaje de una meta cuantitativa al cien por ciento', () => {
    expect(porcentajeProgreso(9, 8)).toBe(100);
  });
});
