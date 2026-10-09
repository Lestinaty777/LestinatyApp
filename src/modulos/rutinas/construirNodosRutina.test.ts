import { describe, expect, it } from 'vitest';

import { construirNodosRutina, ID_DESTINO_RUTINA } from './construirNodosRutina';
import type { PasoRutina } from './rutinas.tipos';

function paso(sobrescribir: Partial<PasoRutina> = {}): PasoRutina {
  return {
    id: 'p', orden: 1, origen: 'propio', habitoId: null, tareaId: null, tareaTipo: null, tareaFrecuencia: null, esencial: true, titulo: 'Paso', iconoLucide: null, color: null,
    modo: 'simple', objetivoValor: null, unidad: null, aplica: true, completo: false, valor: null, ...sobrescribir,
  };
}

describe('construirNodosRutina', () => {
  it('ordena por orden, numera y añade el destino al final', () => {
    const nodos = construirNodosRutina([paso({ id: 'b', orden: 2, titulo: 'Dos' }), paso({ id: 'a', orden: 1, titulo: 'Uno' })], 'Meta');
    expect(nodos.map((nodo) => nodo.id)).toEqual(['a', 'b', ID_DESTINO_RUTINA]);
    expect(nodos.map((nodo) => nodo.numero)).toEqual([1, 2, 0]);
    expect(nodos[2]).toMatchObject({ titulo: 'Meta', esDestino: true });
  });

  it('el primer paso sin completar es el activo; los siguientes, bloqueados', () => {
    const nodos = construirNodosRutina([
      paso({ id: 'a', orden: 1, completo: true }), paso({ id: 'b', orden: 2 }), paso({ id: 'c', orden: 3 }),
    ], 'Meta');
    expect(nodos.map((nodo) => nodo.estado)).toEqual(['completado', 'activo', 'bloqueado', 'bloqueado']);
  });

  it('un paso que no aplica hoy no genera nodo', () => {
    const nodos = construirNodosRutina([paso({ id: 'a', aplica: false }), paso({ id: 'b', orden: 2 })], 'Meta');
    expect(nodos.map((nodo) => nodo.id)).toEqual(['b', ID_DESTINO_RUTINA]);
    expect(nodos[0].numero).toBe(1);
  });

  it('el destino se alcanza con los esenciales aunque queden opcionales', () => {
    const nodos = construirNodosRutina([
      paso({ id: 'a', orden: 1, completo: true }), paso({ id: 'b', orden: 2, esencial: false }),
    ], 'Meta');
    expect(nodos.at(-1)?.estado).toBe('completado');
    expect(nodos[1]).toMatchObject({ estado: 'activo', esencial: false });
  });

  it('un esencial pendiente deja el destino bloqueado', () => {
    const nodos = construirNodosRutina([paso({ id: 'a' }), paso({ id: 'b', orden: 2, esencial: false, completo: true })], 'Meta');
    expect(nodos.at(-1)?.estado).toBe('bloqueado');
  });

  it('si ningún esencial aplica hoy, el destino exige todos los que aplican', () => {
    const pasos = [paso({ id: 'a', aplica: false }), paso({ id: 'b', orden: 2, esencial: false }), paso({ id: 'c', orden: 3, esencial: false, completo: true })];
    expect(construirNodosRutina(pasos, 'Meta').at(-1)?.estado).toBe('bloqueado');
    expect(construirNodosRutina(pasos.map((p) => ({ ...p, completo: true })), 'Meta').at(-1)?.estado).toBe('completado');
  });

  it('sin pasos que apliquen no hay camino', () => {
    expect(construirNodosRutina([], 'Meta')).toEqual([]);
    expect(construirNodosRutina([paso({ aplica: false })], 'Meta')).toEqual([]);
  });
});
