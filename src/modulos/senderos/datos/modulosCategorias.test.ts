import { describe, expect, it } from 'vitest';

import { categoriaInicialMapa, coloresSelectorCategoria, modulosPorCategoria } from './modulosCategorias';

describe('módulos por categoría del mapa', () => {
  it('hábitos sigue siendo la categoría inicial, con sus 5 módulos de release', () => {
    expect(categoriaInicialMapa).toBe('habitos');
    expect(modulosPorCategoria.habitos).toHaveLength(5);
  });

  it('tareas se expone como segunda categoría, sin módulos propios (usa asignaturas reales, no el catálogo mock)', () => {
    expect(modulosPorCategoria.tareas).toEqual([]);
    expect(Object.keys(modulosPorCategoria).sort()).toEqual(['habitos', 'tareas']);
  });
});

describe('colores del selector de categoría', () => {
  it('publica el color de hábitos y de tareas', () => {
    expect(coloresSelectorCategoria).toEqual({
      habitos: '#22C55E',
      tareas: '#FCB103',
    });
  });
});
