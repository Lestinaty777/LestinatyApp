import { describe, expect, it, vi } from 'vitest';

vi.mock('lucide-react-native', () => ({ Check: 'Check', Lock: 'Lock', Play: 'Play' }));

import { construirNodosPlan } from './construirNodosPlan';
import type { PlanDia } from './planes.tipos';

const item = (hecho: boolean) => ({ bloqueId: 'b1', hecho, id: Math.random().toString(), orden: 0, titulo: 'x' });
const dia = (id: string, orden: number, itemsHechos: boolean[], titulo: string | null = null): PlanDia => ({
  bloques: [{ diaId: id, id: `bloque-${id}`, items: itemsHechos.map(item), mensajeContexto: null, momento: 'manana' }],
  id,
  orden,
  seccionId: 's1',
  titulo,
});

describe('construirNodosPlan', () => {
  it('el primer día sin terminar es el único activo; los siguientes quedan bloqueados', () => {
    const nodos = construirNodosPlan([dia('a', 0, [true]), dia('b', 1, [false]), dia('c', 2, [false])]);
    expect(nodos.map((n) => n.estado)).toEqual(['completado', 'activo', 'bloqueado']);
  });

  it('respeta el orden aunque las filas lleguen desordenadas', () => {
    const nodos = construirNodosPlan([dia('c', 2, [false], 'Tres'), dia('a', 0, [true], 'Uno'), dia('b', 1, [true], 'Dos')]);
    expect(nodos.map((n) => n.titulo)).toEqual(['Uno', 'Dos', 'Tres']);
    expect(nodos.map((n) => n.estado)).toEqual(['completado', 'completado', 'activo']);
  });

  it('un día con varios bloques solo se completa cuando TODOS sus ítems están hechos', () => {
    const diaMixto: PlanDia = {
      bloques: [
        { diaId: 'x', id: 'bloque-1', items: [item(true)], mensajeContexto: null, momento: 'manana' },
        { diaId: 'x', id: 'bloque-2', items: [item(false)], mensajeContexto: null, momento: 'tarde' },
      ],
      id: 'x',
      orden: 0,
      seccionId: 's1',
      titulo: null,
    };
    const nodos = construirNodosPlan([diaMixto]);
    expect(nodos[0].estado).toBe('activo');
  });

  it('con todos los días completos, no hay ningún nodo activo', () => {
    const nodos = construirNodosPlan([dia('a', 0, [true]), dia('b', 1, [true])]);
    expect(nodos.every((n) => n.estado === 'completado')).toBe(true);
  });

  it('sin días, no hay nodos', () => {
    expect(construirNodosPlan([])).toEqual([]);
  });

  it('usa el título real del día si existe, o "Día N" si no', () => {
    const nodos = construirNodosPlan([dia('a', 0, [false], 'Fundamentos'), dia('b', 1, [false])]);
    expect(nodos.map((n) => n.titulo)).toEqual(['Fundamentos', 'Día 2']);
  });
});
