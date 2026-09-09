import { describe, expect, it } from 'vitest';

import { accesosCategoriasHabitos, crearModeloFilaHoy } from './presentacion';

describe('presentación de hábitos', () => {
  it('expone las cinco categorías en el orden de la navegación', () => {
    expect(accesosCategoriasHabitos.map((acceso) => acceso.id)).toEqual(['hoy', 'patrones', 'conexiones', 'riesgo', 'impacto']);
  });

  it('crea el avance real de una meta de cantidad', () => {
    expect(crearModeloFilaHoy({ tipoMeta: 'cantidad', meta: 8, unidad: 'vasos', valorHoy: 6 })).toEqual({ progreso: 75, texto: '6/8 vasos' });
  });
});
