import { describe, expect, it } from 'vitest';
import { esMapaSoloLectura, resolverNivelSeleccionado } from './useSenderoHabito.modelo';

describe('resolverNivelSeleccionado', () => {
  it('selecciona el nivel actual al cambiar de hábito o desbloquear', () => {
    expect(resolverNivelSeleccionado(undefined, 3, [1, 2, 3])).toBe(3);
    expect(resolverNivelSeleccionado(2, 3, [1, 2, 3])).toBe(2);
    expect(resolverNivelSeleccionado(4, 3, [1, 2, 3])).toBe(3);
  });
});

describe('esMapaSoloLectura', () => {
  it('marca niveles anteriores como consulta y el actual como editable', () => {
    expect(esMapaSoloLectura(2, 3)).toBe(true);
    expect(esMapaSoloLectura(3, 3)).toBe(false);
  });
});
