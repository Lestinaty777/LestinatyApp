import { describe, expect, it } from 'vitest';

import { mapearSenderoDetalle } from './senderos.mapper';

describe('mapearSenderoDetalle', () => {
  it('mapea un sendero activo con su sección y seis nodos ordenados', () => {
    const detalle = mapearSenderoDetalle({
      categoria_codigo: 'estudio', descripcion: 'Descripcion.', id: 'sendero-1',
      niveles: [{ estado: 'activo', id: 'nivel-1', nodos: [{ id: 'nodo-2', orden: 2, tipo: 'leccion' }, { id: 'nodo-1', orden: 1, tipo: 'leccion' }, { id: 'nodo-3', orden: 3, tipo: 'leccion' }, { id: 'nodo-4', orden: 4, tipo: 'leccion' }, { id: 'nodo-5', orden: 5, tipo: 'leccion' }, { id: 'nodo-6', orden: 6, tipo: 'evaluacion' }], numero: 1, titulo: 'Nivel 1' }], titulo: 'Calculo',
    });
    expect(detalle.nodos.map((nodo) => nodo.orden)).toEqual([1, 2, 3, 4, 5, 6]);
  });
});
