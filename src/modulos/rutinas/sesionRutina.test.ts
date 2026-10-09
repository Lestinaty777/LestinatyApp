import { describe, expect, it } from 'vitest';

import {
  formatoReloj, minutosEstimadosPaso, planearSesion, resolverCompletadoExterno, segundosRestantes,
} from './sesionRutina';
import type { PasoRutina } from './rutinas.tipos';

function paso(sobrescribir: Partial<PasoRutina> = {}): PasoRutina {
  return {
    id: 'p', orden: 1, origen: 'propio', habitoId: null, tareaId: null, tareaTipo: null, tareaFrecuencia: null, esencial: true,
    titulo: 'Paso', iconoLucide: null, color: null, modo: 'simple', objetivoValor: null, unidad: null,
    aplica: true, completo: false, valor: null, ...sobrescribir,
  };
}

describe('minutosEstimadosPaso', () => {
  it('cronómetro usa su objetivo; contador, checklist y simple tienen una estimación fija', () => {
    expect(minutosEstimadosPaso({ modo: 'cronometro', objetivoValor: 10 })).toBe(10);
    expect(minutosEstimadosPaso({ modo: 'cronometro', objetivoValor: 7.2 })).toBe(8);
    expect(minutosEstimadosPaso({ modo: 'cronometro', objetivoValor: null })).toBe(5);
    expect(minutosEstimadosPaso({ modo: 'contador', objetivoValor: 20 })).toBe(5);
    expect(minutosEstimadosPaso({ modo: 'checklist', objetivoValor: null })).toBe(5);
    expect(minutosEstimadosPaso({ modo: 'simple', objetivoValor: null })).toBe(2);
  });
});

describe('planearSesion', () => {
  const pasos = [
    paso({ id: 'a', orden: 1, modo: 'cronometro', objetivoValor: 10 }),
    paso({ id: 'b', orden: 2, modo: 'cronometro', objetivoValor: 10, esencial: false }),
    paso({ id: 'c', orden: 3, modo: 'simple' }),
    paso({ id: 'd', orden: 4, modo: 'simple', esencial: false }),
  ];
  const ids = (lista: PasoRutina[]) => lista.map((p) => p.id);

  it('sin límite de tiempo entran todos los pendientes en orden', () => {
    const plan = planearSesion(pasos, null);
    expect(ids(plan.pasos)).toEqual(['a', 'b', 'c', 'd']);
    expect(plan.omitidos).toEqual([]);
    expect(plan.minutosTotal).toBe(24);
    expect(plan.excede).toBe(false);
  });

  it('con tiempo limitado entran los esenciales y los opcionales que caben, conservando el orden', () => {
    const plan = planearSesion(pasos, 15);
    expect(ids(plan.pasos)).toEqual(['a', 'c', 'd']);
    expect(ids(plan.omitidos)).toEqual(['b']);
    expect(plan.minutosTotal).toBe(14);
    expect(plan.excede).toBe(false);
  });

  it('si los esenciales no caben, se incluyen igual y se marca que excede', () => {
    const plan = planearSesion(pasos, 5);
    expect(ids(plan.pasos)).toEqual(['a', 'c']);
    expect(ids(plan.omitidos)).toEqual(['b', 'd']);
    expect(plan.excede).toBe(true);
  });

  it('ignora lo ya completado y lo que no aplica hoy', () => {
    const plan = planearSesion([paso({ id: 'a', completo: true }), paso({ id: 'b', orden: 2, aplica: false }), paso({ id: 'c', orden: 3 })], null);
    expect(ids(plan.pasos)).toEqual(['c']);
  });

  it('si ningún esencial aplica hoy, todos los pendientes son requeridos', () => {
    const plan = planearSesion([
      paso({ id: 'a', esencial: true, aplica: false }), paso({ id: 'b', orden: 2, esencial: false, modo: 'cronometro', objetivoValor: 20 }),
    ], 5);
    expect(ids(plan.pasos)).toEqual(['b']);
    expect(plan.excede).toBe(true);
  });

  it('sin pasos pendientes devuelve un plan vacío', () => {
    expect(planearSesion([paso({ completo: true })], 15)).toEqual({ pasos: [], omitidos: [], minutosTotal: 0, excede: false });
  });
});

describe('relojes', () => {
  it('segundosRestantes redondea hacia arriba y nunca es negativo', () => {
    expect(segundosRestantes(10_000, 0)).toBe(10);
    expect(segundosRestantes(10_000, 9_001)).toBe(1);
    expect(segundosRestantes(10_000, 10_000)).toBe(0);
    expect(segundosRestantes(10_000, 20_000)).toBe(0);
  });

  it('formatoReloj muestra m:ss y h:mm:ss', () => {
    expect(formatoReloj(0)).toBe('0:00');
    expect(formatoReloj(9)).toBe('0:09');
    expect(formatoReloj(305)).toBe('5:05');
    expect(formatoReloj(3725)).toBe('1:02:05');
    expect(formatoReloj(-4)).toBe('0:00');
  });
});

describe('resolverCompletadoExterno', () => {
  const tarea = (tareaTipo: PasoRutina['tareaTipo'], tareaFrecuencia: PasoRutina['tareaFrecuencia'], objetivoValor: number | null = null) =>
    resolverCompletadoExterno({ origen: 'tarea', objetivoValor, tareaTipo, tareaFrecuencia });

  it('hábito: registra la meta completa', () => {
    expect(resolverCompletadoExterno({ origen: 'habito', objetivoValor: 8, tareaTipo: null, tareaFrecuencia: null })).toEqual({ accion: 'habito', valor: 8 });
    expect(resolverCompletadoExterno({ origen: 'habito', objetivoValor: null, tareaTipo: null, tareaFrecuencia: null })).toEqual({ accion: 'habito', valor: 1 });
  });

  it('sigue la tabla de ruteo de Tareas', () => {
    expect(tarea('checklist', 'dias_semana')).toEqual({ accion: 'completar_tarea_dia' });
    expect(tarea('checklist', 'una_vez')).toEqual({ accion: 'completar_tarea_dia' });
    expect(tarea('simple', 'una_vez')).toEqual({ accion: 'completar_tarea_dia' });
    expect(tarea('simple', 'dias_semana')).toEqual({ accion: 'registrar_progreso_tarea', valor: 1 });
    expect(tarea('contador', 'dias_semana', 8)).toEqual({ accion: 'registrar_progreso_tarea', valor: 8 });
    expect(tarea('cronometro', 'dias_semana', 20)).toEqual({ accion: 'registrar_progreso_tarea', valor: 20 });
    expect(tarea('contador', 'una_vez', 8)).toEqual({ accion: 'registrar_progreso_tarea_unica', valor: 8 });
    expect(tarea('cronometro', 'una_vez', 20)).toEqual({ accion: 'registrar_progreso_tarea_unica', valor: 20 });
  });

  it('sin datos de la tarea cae al toggle simple; un paso propio no aplica', () => {
    expect(tarea(null, null)).toEqual({ accion: 'completar_tarea_dia' });
    expect(resolverCompletadoExterno({ origen: 'propio', objetivoValor: null, tareaTipo: null, tareaFrecuencia: null })).toBeNull();
  });
});
