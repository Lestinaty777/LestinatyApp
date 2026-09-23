import { describe, expect, it } from 'vitest';

import { mapearResultadoReclamoTarea, mapearResumenTareasDiarias } from './tareasDiarias.mapper';

describe('mapearResumenTareasDiarias', () => {
  it('cero nodos completados: las tres tareas quedan bloqueadas', () => {
    const resumen = mapearResumenTareasDiarias({
      fecha_local: '2026-09-22',
      nodos_programados: 3,
      tareas: [
        { codigo: 'sendero_1_nodo', gemas: 4, progreso: 0, meta: 1, estado: 'bloqueada' },
        { codigo: 'sendero_2_nodos', gemas: 7, progreso: 0, meta: 2, estado: 'bloqueada' },
        { codigo: 'sendero_dia_completo', gemas: 10, progreso: 0, meta: 3, estado: 'bloqueada' },
      ],
    });
    expect(resumen.tareas.every((tarea) => tarea.estado === 'bloqueada')).toBe(true);
  });

  it('un nodo completado: sólo sendero_1_nodo queda disponible', () => {
    const resumen = mapearResumenTareasDiarias({
      fecha_local: '2026-09-22',
      nodos_programados: 3,
      tareas: [
        { codigo: 'sendero_1_nodo', gemas: 4, progreso: 1, meta: 1, estado: 'disponible' },
        { codigo: 'sendero_2_nodos', gemas: 7, progreso: 1, meta: 2, estado: 'bloqueada' },
        { codigo: 'sendero_dia_completo', gemas: 10, progreso: 1, meta: 3, estado: 'bloqueada' },
      ],
    });
    expect(resumen.tareas.find((tarea) => tarea.codigo === 'sendero_1_nodo')?.estado).toBe('disponible');
    expect(resumen.tareas.find((tarea) => tarea.codigo === 'sendero_2_nodos')?.estado).toBe('bloqueada');
  });

  it('dos nodos completados: sendero_1_nodo y sendero_2_nodos disponibles', () => {
    const resumen = mapearResumenTareasDiarias({
      fecha_local: '2026-09-22',
      nodos_programados: 3,
      tareas: [
        { codigo: 'sendero_1_nodo', gemas: 4, progreso: 2, meta: 1, estado: 'disponible' },
        { codigo: 'sendero_2_nodos', gemas: 7, progreso: 2, meta: 2, estado: 'disponible' },
        { codigo: 'sendero_dia_completo', gemas: 10, progreso: 2, meta: 3, estado: 'bloqueada' },
      ],
    });
    expect(resumen.tareas.filter((tarea) => tarea.estado === 'disponible')).toHaveLength(2);
  });

  it('todos los nodos programados completados: las tres tareas disponibles', () => {
    const resumen = mapearResumenTareasDiarias({
      fecha_local: '2026-09-22',
      nodos_programados: 2,
      tareas: [
        { codigo: 'sendero_1_nodo', gemas: 4, progreso: 2, meta: 1, estado: 'disponible' },
        { codigo: 'sendero_2_nodos', gemas: 7, progreso: 2, meta: 2, estado: 'disponible' },
        { codigo: 'sendero_dia_completo', gemas: 10, progreso: 2, meta: 2, estado: 'disponible' },
      ],
    });
    expect(resumen.tareas.every((tarea) => tarea.estado === 'disponible')).toBe(true);
  });

  it('ningún hábito programado hoy: no llega sendero_dia_completo', () => {
    const resumen = mapearResumenTareasDiarias({
      fecha_local: '2026-09-22',
      nodos_programados: 0,
      tareas: [
        { codigo: 'sendero_1_nodo', gemas: 4, progreso: 0, meta: 1, estado: 'bloqueada' },
        { codigo: 'sendero_2_nodos', gemas: 7, progreso: 0, meta: 2, estado: 'bloqueada' },
      ],
    });
    expect(resumen.tareas.find((tarea) => tarea.codigo === 'sendero_dia_completo')).toBeUndefined();
  });

  it('tareas ya reclamadas se mapean a estado reclamada', () => {
    const resumen = mapearResumenTareasDiarias({
      fecha_local: '2026-09-22',
      nodos_programados: 1,
      tareas: [{ codigo: 'sendero_1_nodo', gemas: 4, progreso: 1, meta: 1, estado: 'reclamada' }],
    });
    expect(resumen.tareas[0].estado).toBe('reclamada');
  });
});

describe('mapearResultadoReclamoTarea', () => {
  it('convierte el payload snake_case sin inventar campos', () => {
    const resultado = mapearResultadoReclamoTarea({
      exito: true,
      tarea_codigo: 'sendero_1_nodo',
      gemas: 4,
      saldo: 24,
      ya_reclamado: false,
    });
    expect(resultado).toEqual({ exito: true, tareaCodigo: 'sendero_1_nodo', gemas: 4, saldo: 24, yaReclamado: false });
  });

  it('reintento idempotente: ya_reclamado true no debe perderse en el mapeo', () => {
    const resultado = mapearResultadoReclamoTarea({
      exito: true,
      tarea_codigo: 'sendero_2_nodos',
      gemas: 7,
      saldo: 31,
      ya_reclamado: true,
    });
    expect(resultado.yaReclamado).toBe(true);
  });
});
