import { describe, expect, it, vi } from 'vitest';

vi.mock('lucide-react-native', () => ({ Check: 'Check', Lock: 'Lock', Play: 'Play' }));

import { construirNodosDiasTarea } from './construirNodosDiasTarea';

describe('construirNodosDiasTarea', () => {
  it('marca el nodo siguiente como esperando (no activo) hasta el próximo día programado', () => {
    const nodos = construirNodosDiasTarea(1, 3, 1, { puedeAvanzarHoy: false });
    expect(nodos.map((nodo) => nodo.estado)).toEqual(['completado', 'esperando', 'bloqueado', 'bloqueado']);
  });

  it('habilita el nodo siguiente como activo cuando se puede avanzar hoy', () => {
    const nodos = construirNodosDiasTarea(1, 3, 1, { puedeAvanzarHoy: true });
    expect(nodos.map((nodo) => nodo.estado)).toEqual(['completado', 'activo', 'bloqueado', 'bloqueado']);
  });

  it('incluye ciclo en el cofre final (maestría de nivel 7)', () => {
    const nodos = construirNodosDiasTarea(42, 42, 7, { ciclo: 2, puedeAvanzarHoy: false });
    expect(nodos[nodos.length - 1].cofre).toMatchObject({ ciclo: 2, gemasMax: 35, gemasMin: 35, tipo: 'final' });
  });

  const figuraEjemplo = {
    ciclo: 1, color: '#FCB103', estado: 'creada' as const, nivel: 1, nodoDia: 1,
    paqueteId: 'golden', registroId: 'reg-1', semilla: 'abc', trazos: null,
  };

  it('un día completado con figura se reemplaza por orbe_figura', () => {
    const figurasPorDia = new Map([[1, figuraEjemplo]]);
    const nodos = construirNodosDiasTarea(1, 3, 1, { puedeAvanzarHoy: true }, figurasPorDia);
    expect(nodos[0].tipoNodo).toBe('orbe_figura');
    expect(nodos[0].figura).toEqual(figuraEjemplo);
  });

  it('sin figura para ese día, un día completado sigue siendo tipoNodo "dia"', () => {
    const nodos = construirNodosDiasTarea(1, 3, 1, { puedeAvanzarHoy: true });
    expect(nodos[0].tipoNodo).toBe('dia');
  });

  it('el día de acción muestra su orbe_figura y el cofre final se mantiene independiente', () => {
    const figuraDelCofre = { ...figuraEjemplo, nodoDia: 3 };
    const figurasPorDia = new Map([[3, figuraDelCofre]]);
    const nodos = construirNodosDiasTarea(3, 3, 1, { puedeAvanzarHoy: true }, figurasPorDia);
    expect(nodos[2].tipoNodo).toBe('orbe_figura');
    expect(nodos[2].figura).toEqual(figuraDelCofre);
    expect(nodos[3].tipoNodo).toBe('cofre_final');
  });

  it('el cofre final nunca queda "disponible" — registrar_progreso_tarea ya lo acredita solo', () => {
    const nodos = construirNodosDiasTarea(3, 3, 1, { puedeAvanzarHoy: true });
    const cofreFinal = nodos[nodos.length - 1];
    expect(cofreFinal.cofre?.estadoCofre).toBe('reclamado');
    expect(cofreFinal.cofre?.estadoCofre).not.toBe('disponible');
    expect(cofreFinal.estado).toBe('completado');
  });

  it('sin ningún día completado, el cofre final queda bloqueado', () => {
    const nodos = construirNodosDiasTarea(0, 3, 1, { puedeAvanzarHoy: true });
    const cofreFinal = nodos[nodos.length - 1];
    expect(cofreFinal.cofre?.estadoCofre).toBe('bloqueado');
    expect(cofreFinal.estado).toBe('bloqueado');
  });
});
