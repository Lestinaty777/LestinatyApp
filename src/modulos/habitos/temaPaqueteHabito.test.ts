import { describe, expect, it } from 'vitest';
import { obtenerColorMasterPaquete } from './temaPaqueteHabito';

describe('obtenerColorMasterPaquete', () => {
  it('convierte Mathist al tema morado de MasterIcon', () => {
    expect(obtenerColorMasterPaquete('#B25FFB')).toBe(7);
  });

  it('conserva Esmeralda en el tema verde', () => {
    expect(obtenerColorMasterPaquete('#029060')).toBe(2);
  });
});
