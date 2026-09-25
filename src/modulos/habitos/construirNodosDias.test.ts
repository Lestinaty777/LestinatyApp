import { describe, expect, it, vi } from 'vitest';

vi.mock('lucide-react-native', () => ({ Check: 'Check', Lock: 'Lock', Play: 'Play' }));

import { construirNodosDias } from './construirNodosDias';

describe('construirNodosDias', () => {
  it('incluye ciclo en cofres de maestría y no habilita acciones históricas', () => {
    const nodos = construirNodosDias(42, 42, 7, new Map(), {
      ciclo: 2, puedeAvanzarHoy: false, soloLectura: true,
    });
    expect(nodos[3].cofre).toMatchObject({ ciclo: 2, nodoDia: 3, tipo: 'intermedio' });
    expect(nodos[nodos.length - 1].cofre).toMatchObject({ ciclo: 2, gemasMin: 35, gemasMax: 35, tipo: 'final' });
    expect(nodos.every((nodo) => nodo.estado !== 'activo')).toBe(true);
  });

  it('marca el nodo siguiente como esperando (no activo) hasta el próximo día programado', () => {
    const nodos = construirNodosDias(1, 3, 1, new Map(), {
      ciclo: 1, puedeAvanzarHoy: false, soloLectura: false,
    });
    expect(nodos.map((nodo) => nodo.estado)).toEqual(['completado', 'esperando', 'bloqueado', 'bloqueado']);
  });

  it('un nivel/ciclo histórico (soloLectura) nunca marca esperando, incluso en el nodo siguiente', () => {
    const nodos = construirNodosDias(1, 3, 1, new Map(), {
      ciclo: 1, puedeAvanzarHoy: false, soloLectura: true,
    });
    expect(nodos.map((nodo) => nodo.estado)).toEqual(['completado', 'bloqueado', 'bloqueado', 'bloqueado']);
  });

  it('habilita el nodo siguiente como activo cuando se puede avanzar hoy', () => {
    const nodos = construirNodosDias(1, 3, 1, new Map(), {
      ciclo: 1, puedeAvanzarHoy: true, soloLectura: false,
    });
    expect(nodos.map((nodo) => nodo.estado)).toEqual(['completado', 'activo', 'bloqueado', 'bloqueado']);
  });

  const mandalaEjemplo = {
    ciclo: 1, color: '#7FE3B0', estado: 'creada' as const, nivel: 1, nodoDia: 1,
    paqueteId: 'esmeralda', registroId: 'reg-1', semilla: 'abc', trazos: null,
  };

  it('un día normal completado con mandala se reemplaza por orbe_mandala', () => {
    const mandalasPorDia = new Map([[1, mandalaEjemplo]]);
    const nodos = construirNodosDias(1, 3, 1, new Map(), { ciclo: 1, puedeAvanzarHoy: true }, mandalasPorDia);
    expect(nodos[0].tipoNodo).toBe('orbe_mandala');
    expect(nodos[0].mandala).toEqual(mandalaEjemplo);
  });

  it('el día de acción muestra su orbe_mandala y el cofre final se mantiene independiente', () => {
    const mandalaDelCofre = { ...mandalaEjemplo, nodoDia: 3 };
    const mandalasPorDia = new Map([[3, mandalaDelCofre]]);
    const nodos = construirNodosDias(3, 3, 1, new Map(), { ciclo: 1, puedeAvanzarHoy: true }, mandalasPorDia);
    expect(nodos[2].tipoNodo).toBe('orbe_mandala');
    expect(nodos[2].mandala).toEqual(mandalaDelCofre);
    expect(nodos[3].tipoNodo).toBe('cofre_final');
  });

  it('sin mandala para ese día, un día normal completado sigue siendo tipoNodo "dia"', () => {
    const nodos = construirNodosDias(1, 3, 1, new Map(), { ciclo: 1, puedeAvanzarHoy: true });
    expect(nodos[0].tipoNodo).toBe('dia');
  });

  it('el cofre final nunca queda "disponible" (registrar_progreso_habito lo acredita solo, reclamar_cofre_sendero rechaza tipo "final")', () => {
    // Último día recién completado, pero la consulta de cofres reclamados
    // todavía no refrescó (mapa vacío) — exactamente la ventana donde antes
    // el cofre final quedaba tocable y disparaba el RPC rechazado.
    const nodos = construirNodosDias(3, 3, 1, new Map(), { ciclo: 1, puedeAvanzarHoy: true });
    const cofreFinal = nodos[nodos.length - 1];
    expect(cofreFinal.cofre?.estadoCofre).toBe('reclamado');
    expect(cofreFinal.cofre?.estadoCofre).not.toBe('disponible');
    expect(cofreFinal.estado).toBe('completado');
  });
});
