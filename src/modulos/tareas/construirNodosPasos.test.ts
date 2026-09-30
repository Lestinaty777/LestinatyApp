import { describe, expect, it, vi } from 'vitest';

vi.mock('lucide-react-native', () => ({ Check: 'Check', Lock: 'Lock', Play: 'Play' }));

import { construirNodosPasos } from './construirNodosPasos';

const paso = (id: string, titulo: string, hecho: boolean, orden: number) => ({ hecho, id, orden, tareaId: 't1', titulo });

describe('construirNodosPasos', () => {
  it('el primer paso sin hacer es el único activo; los siguientes quedan bloqueados', () => {
    const nodos = construirNodosPasos([paso('a', 'Uno', true, 0), paso('b', 'Dos', false, 1), paso('c', 'Tres', false, 2)]);
    expect(nodos.map((n) => n.estado)).toEqual(['completado', 'activo', 'bloqueado']);
  });

  it('respeta el orden aunque las filas lleguen desordenadas', () => {
    const nodos = construirNodosPasos([paso('c', 'Tres', false, 2), paso('a', 'Uno', true, 0), paso('b', 'Dos', true, 1)]);
    expect(nodos.map((n) => n.titulo)).toEqual(['Uno', 'Dos', 'Tres']);
    expect(nodos.map((n) => n.estado)).toEqual(['completado', 'completado', 'activo']);
  });

  it('con todos hechos, no hay ningún nodo activo', () => {
    const nodos = construirNodosPasos([paso('a', 'Uno', true, 0), paso('b', 'Dos', true, 1)]);
    expect(nodos.every((n) => n.estado === 'completado')).toBe(true);
  });

  it('sin pasos, no hay nodos', () => {
    expect(construirNodosPasos([])).toEqual([]);
  });
});
