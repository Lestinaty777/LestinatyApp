import { describe, expect, it } from 'vitest';
import { calcularRachaTarea, estaProgramadaEnFecha } from './tareaProgramada';

describe('estaProgramadaEnFecha', () => {
  it('una_vez solo toca el día exacto de vencimiento', () => {
    const tarea = { diasSemana: null, fechaVencimiento: '2026-10-05', frecuencia: 'una_vez' as const };
    expect(estaProgramadaEnFecha(tarea, '2026-10-05')).toBe(true);
    expect(estaProgramadaEnFecha(tarea, '2026-10-04')).toBe(false);
    expect(estaProgramadaEnFecha(tarea, '2026-10-06')).toBe(false);
  });

  it('dias_semana toca solo los días elegidos (isodow, 1=lunes..7=domingo)', () => {
    // 2026-09-28 es lunes.
    const soloLunesYMiercoles = { diasSemana: [1, 3], fechaVencimiento: null, frecuencia: 'dias_semana' as const };
    expect(estaProgramadaEnFecha(soloLunesYMiercoles, '2026-09-28')).toBe(true); // lunes
    expect(estaProgramadaEnFecha(soloLunesYMiercoles, '2026-09-29')).toBe(false); // martes
    expect(estaProgramadaEnFecha(soloLunesYMiercoles, '2026-09-30')).toBe(true); // miércoles
  });

  it('dias_semana con los 7 días toca todos los días ("todos los días" es solo elegirlos todos)', () => {
    const todosLosDias = { diasSemana: [1, 2, 3, 4, 5, 6, 7], fechaVencimiento: null, frecuencia: 'dias_semana' as const };
    for (let dia = 28; dia <= 30; dia += 1) expect(estaProgramadaEnFecha(todosLosDias, `2026-09-${dia}`)).toBe(true);
  });
});

describe('calcularRachaTarea', () => {
  const diaria = { diasSemana: [1, 2, 3, 4, 5, 6, 7], fechaVencimiento: null, frecuencia: 'dias_semana' as const };

  it('una tarea una_vez no tiene racha (siempre 0)', () => {
    const unaVez = { diasSemana: null, fechaVencimiento: '2026-09-30', frecuencia: 'una_vez' as const };
    expect(calcularRachaTarea(unaVez, new Set(['2026-09-30']), new Date('2026-09-30T12:00:00'))).toBe(0);
  });

  it('cuenta días programados consecutivos hacia atrás desde la referencia', () => {
    const completadas = new Set(['2026-09-28', '2026-09-29', '2026-09-30']);
    expect(calcularRachaTarea(diaria, completadas, new Date('2026-09-30T12:00:00'))).toBe(3);
  });

  it('se corta apenas falta un día programado', () => {
    const completadas = new Set(['2026-09-26', '2026-09-27', '2026-09-29', '2026-09-30']); // falta el 28
    expect(calcularRachaTarea(diaria, completadas, new Date('2026-09-30T12:00:00'))).toBe(2);
  });

  it('si hoy todavía no se completó, la racha es 0 aunque ayer sí', () => {
    const completadas = new Set(['2026-09-29']);
    expect(calcularRachaTarea(diaria, completadas, new Date('2026-09-30T12:00:00'))).toBe(0);
  });

  it('un día no programado no cuenta ni corta la racha (se salta)', () => {
    // Solo lunes/miércoles/viernes — martes y jueves no deben exigir registro.
    const loMiVi = { diasSemana: [1, 3, 5], fechaVencimiento: null, frecuencia: 'dias_semana' as const };
    // lunes 28, miércoles 30 completados; el martes 29 (no programado) no tiene registro y no debe cortar.
    const completadas = new Set(['2026-09-28', '2026-09-30']);
    expect(calcularRachaTarea(loMiVi, completadas, new Date('2026-09-30T12:00:00'))).toBe(2);
  });
});
