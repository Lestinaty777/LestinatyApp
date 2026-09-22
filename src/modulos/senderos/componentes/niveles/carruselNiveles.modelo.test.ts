import { describe, expect, it } from 'vitest';
import { esSeccionSeleccionable, indiceScrollParaNivel } from './carruselNiveles.modelo';

describe('esSeccionSeleccionable', () => {
  it('bloquea la selección de secciones bloqueadas', () => {
    expect(esSeccionSeleccionable({ estado: 'bloqueado' })).toBe(false);
  });

  it('permite seleccionar secciones completadas o la actual', () => {
    expect(esSeccionSeleccionable({ estado: 'completado' })).toBe(true);
    expect(esSeccionSeleccionable({ estado: 'actual' })).toBe(true);
  });
});

describe('indiceScrollParaNivel', () => {
  it('clampea al último índice válido', () => {
    expect(indiceScrollParaNivel(7, 7)).toBe(6);
  });

  it('clampea a 0 cuando el nivel es menor al mínimo', () => {
    expect(indiceScrollParaNivel(0, 7)).toBe(0);
  });

  it('devuelve el índice 0-based normal dentro de rango', () => {
    expect(indiceScrollParaNivel(3, 7)).toBe(2);
  });
});
