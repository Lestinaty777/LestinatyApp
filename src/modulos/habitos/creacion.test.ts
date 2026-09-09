import { describe, expect, it } from 'vitest';

import { validarNuevoHabito } from './creacion';

describe('validarNuevoHabito', () => {
  it('requiere un título visible', () => {
    expect(validarNuevoHabito({ titulo: '   ', meta: '8', unidad: 'vasos' })).toBe('Escribe el nombre del hábito.');
  });

  it('acepta una meta positiva', () => {
    expect(validarNuevoHabito({ titulo: 'Agua', meta: '8', unidad: 'vasos' })).toBeNull();
  });
});
