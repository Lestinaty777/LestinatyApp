import { describe, expect, it } from 'vitest';

import { calcularNivelPlan, calcularRitmoPlan } from './progresoPlan';

describe('calcularNivelPlan', () => {
  it('nivel 1 sin ítems', () => {
    expect(calcularNivelPlan(0, 0)).toBe(1);
  });

  it('nivel 1 recién empezado', () => {
    expect(calcularNivelPlan(0, 10)).toBe(1);
  });

  it('sube proporcionalmente al avance', () => {
    expect(calcularNivelPlan(5, 10)).toBe(4);
  });

  it('nivel 7 al completar todo', () => {
    expect(calcularNivelPlan(10, 10)).toBe(7);
  });

  it('nunca pasa de 7 ni baja de 1', () => {
    expect(calcularNivelPlan(1, 1)).toBe(7);
    expect(calcularNivelPlan(1, 1000)).toBe(1);
  });
});

describe('calcularRitmoPlan', () => {
  const ahora = Date.now();
  const haceUnDia = new Date(ahora - 24 * 60 * 60 * 1000).toISOString();
  const enUnDia = new Date(ahora + 24 * 60 * 60 * 1000).toISOString();

  it('sin fecha objetivo', () => {
    expect(calcularRitmoPlan({ completadas: 1, creadoEn: haceUnDia, fechaObjetivo: null, total: 10 })).toBe('sin_fecha');
  });

  it('sin ítems todavía', () => {
    expect(calcularRitmoPlan({ completadas: 0, creadoEn: haceUnDia, fechaObjetivo: enUnDia, total: 0 })).toBe('sin_fecha');
  });

  it('adelantado: mitad de camino en tiempo pero casi listo en tareas', () => {
    const inicio = new Date(ahora - 10 * 24 * 60 * 60 * 1000).toISOString();
    const fin = new Date(ahora + 10 * 24 * 60 * 60 * 1000).toISOString();
    expect(calcularRitmoPlan({ completadas: 9, creadoEn: inicio, fechaObjetivo: fin, total: 10 })).toBe('adelantado');
  });

  it('atrasado: casi se acaba el tiempo pero recién arrancando', () => {
    const inicio = new Date(ahora - 19 * 24 * 60 * 60 * 1000).toISOString();
    const fin = new Date(ahora + 1 * 24 * 60 * 60 * 1000).toISOString();
    expect(calcularRitmoPlan({ completadas: 1, creadoEn: inicio, fechaObjetivo: fin, total: 10 })).toBe('atrasado');
  });

  it('a tiempo: progreso de tareas y de tiempo parejos', () => {
    const inicio = new Date(ahora - 5 * 24 * 60 * 60 * 1000).toISOString();
    const fin = new Date(ahora + 5 * 24 * 60 * 60 * 1000).toISOString();
    expect(calcularRitmoPlan({ completadas: 5, creadoEn: inicio, fechaObjetivo: fin, total: 10 })).toBe('a_tiempo');
  });
});
