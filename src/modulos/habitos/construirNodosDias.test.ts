import { describe, expect, it, vi } from 'vitest';

vi.mock('lucide-react-native', () => ({ Check: 'Check', Lock: 'Lock', Play: 'Play' }));

import { construirNodosDias } from './construirNodosDias';

describe('construirNodosDias', () => {
  it('incluye ciclo en cofres de maestría y no habilita acciones históricas', () => {
    const nodos = construirNodosDias(42, 42, 7, new Map(), {
      ciclo: 2, puedeAvanzarHoy: false, soloLectura: true,
    });
    expect(nodos[2].cofre).toMatchObject({ ciclo: 2, nodoDia: 3, tipo: 'intermedio' });
    expect(nodos[41].cofre).toMatchObject({ ciclo: 2, gemasMin: 35, gemasMax: 35, tipo: 'final' });
    expect(nodos.every((nodo) => nodo.estado !== 'activo')).toBe(true);
  });

  it('bloquea el siguiente nodo hasta el próximo día programado', () => {
    const nodos = construirNodosDias(1, 3, 1, new Map(), {
      ciclo: 1, puedeAvanzarHoy: false, soloLectura: false,
    });
    expect(nodos.map((nodo) => nodo.estado)).toEqual(['completado', 'bloqueado', 'bloqueado']);
  });

  it('habilita el nodo siguiente como activo cuando se puede avanzar hoy', () => {
    const nodos = construirNodosDias(1, 3, 1, new Map(), {
      ciclo: 1, puedeAvanzarHoy: true, soloLectura: false,
    });
    expect(nodos.map((nodo) => nodo.estado)).toEqual(['completado', 'activo', 'bloqueado']);
  });
});
