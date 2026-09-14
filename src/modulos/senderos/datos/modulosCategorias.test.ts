import { describe, expect, it } from 'vitest';

import { categoriaInicialMapa, coloresSelectorCategoria, modulosPorCategoria } from './modulosCategorias';

describe('módulos por categoría del mapa', () => {
  it('inicia en hábitos y mantiene los conteos del MVP', () => {
    expect(categoriaInicialMapa).toBe('habitos');
    expect(modulosPorCategoria.habitos).toHaveLength(5);
    expect(modulosPorCategoria.rutinas).toHaveLength(3);
    expect(modulosPorCategoria.tareas).toHaveLength(1);
  });
});

describe('colores del selector de categoría', () => {
  it('usa un fondo saturado diferente para cada categoría', () => {
    expect(coloresSelectorCategoria).toEqual({
      habitos: '#22C55E',
      rutinas: '#D94640',
      tareas: '#E5A900',
    });
  });
});
