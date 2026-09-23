import { describe, expect, it } from 'vitest';

import { categoriaInicialMapa, coloresSelectorCategoria, modulosPorCategoria } from './modulosCategorias';

describe('módulos por categoría del mapa', () => {
  it('expone únicamente hábitos en la superficie de release', () => {
    expect(categoriaInicialMapa).toBe('habitos');
    expect(modulosPorCategoria.habitos).toHaveLength(5);
    expect(Object.keys(modulosPorCategoria)).toEqual(['habitos']);
  });
});

describe('colores del selector de categoría', () => {
  it('solo publica el color de hábitos', () => {
    expect(coloresSelectorCategoria).toEqual({
      habitos: '#22C55E',
    });
  });
});
