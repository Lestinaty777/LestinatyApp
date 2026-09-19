import { describe, expect, it } from 'vitest';
import { obtenerPaqueteVisualHabito } from './paqueteVisual';

describe('obtenerPaqueteVisualHabito', () => {
  it('usa Esmeralda como paquete visual predeterminado', () => {
    expect(obtenerPaqueteVisualHabito()).toMatchObject({ id: 'esmeralda', nombre: 'Esmeralda' });
  });

  it('resuelve Mathist por su id de paquete', () => {
    const paquete = obtenerPaqueteVisualHabito('mathist');

    expect(paquete).toMatchObject({ id: 'mathist', nombre: 'Mathist' });
  });
});
