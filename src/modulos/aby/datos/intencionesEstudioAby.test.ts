import { describe, expect, it } from 'vitest';

import { colorIntencionEstudioAby, intencionesEstudioAby } from './intencionesEstudioAby';

describe('intencionesEstudioAby', () => {
  it('expone las cuatro intenciones universitarias con colores y ejemplos únicos', () => {
    expect(intencionesEstudioAby.map((item) => item.id)).toEqual([
      'examen',
      'materia',
      'habito-estudio',
      'rutina-estudio',
    ]);
    expect(new Set(intencionesEstudioAby.map((item) => item.color))).toHaveLength(4);
    expect(new Set(intencionesEstudioAby.map((item) => item.placeholder))).toHaveLength(4);
  });

  it('usa azul académico antes de seleccionar una intención', () => {
    expect(colorIntencionEstudioAby(null)).toBe('#377DDE');
    expect(colorIntencionEstudioAby('examen')).toBe('#377DDE');
  });
});
