import { describe, expect, it } from 'vitest';

import { categoriaVisualIntencionEstudioAby, colorIntencionEstudioAby, intencionesEstudioAby, subtituloIntencionEstudioAby } from './intencionesEstudioAby';

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

  it('asigna a cada intención su bioma visual existente', () => {
    expect(categoriaVisualIntencionEstudioAby('examen')).toBe('rutinas');
    expect(categoriaVisualIntencionEstudioAby('materia')).toBe('salud');
    expect(categoriaVisualIntencionEstudioAby('habito-estudio')).toBe('tareas');
    expect(categoriaVisualIntencionEstudioAby('rutina-estudio')).toBe('habitos');
  });

  it('explica el contexto mínimo de cada intención antes de pedir datos', () => {
    expect(intencionesEstudioAby.find((item) => item.id === 'examen')?.contexto).toBe('Fecha, temas y material. Aby crea tu plan de repaso.');
    expect(intencionesEstudioAby.find((item) => item.id === 'materia')?.contexto).toBe('Define el tema y tu nivel. Aby ordena lo que necesitas dominar.');
  });

  it('reemplaza el subtítulo neutro por la intención activa', () => {
    expect(subtituloIntencionEstudioAby(null)).toBe('Cuéntale a Lestinaty qué necesitas estudiar.');
    expect(subtituloIntencionEstudioAby('examen')).toBe('TENGO UN EXAMEN');
    expect(subtituloIntencionEstudioAby('materia')).toBe('DOMINAR UNA MATERIA');
  });
});
