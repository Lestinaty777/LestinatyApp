import { describe, expect, it } from 'vitest';

import { indiceDiaSemana, mapearResumenHoy } from './resumenHoy.mapper';

describe('mapearResumenHoy', () => {
  it('mapea la respuesta del servidor', () => {
    expect(mapearResumenHoy({ fecha: '2026-10-09', racha: 3, dias_activos_semana: [3, 4, 5], xp_total: 15 }))
      .toEqual({ racha: 3, diasActivosSemana: [3, 4, 5], xpTotal: 15 });
  });

  it('acepta números como texto y descarta días fuera de 1–7 o repetidos', () => {
    expect(mapearResumenHoy({ racha: '2', dias_activos_semana: [5, 1, 5, 9, 0, 'x'], xp_total: '40' }))
      .toEqual({ racha: 2, diasActivosSemana: [1, 5], xpTotal: 40 });
  });

  it('rechaza una respuesta rota', () => {
    expect(() => mapearResumenHoy(null)).toThrow();
    expect(() => mapearResumenHoy([])).toThrow();
    expect(() => mapearResumenHoy({ racha: 1, xp_total: 1 })).toThrow('dias_activos_semana');
    expect(() => mapearResumenHoy({ racha: -1, dias_activos_semana: [], xp_total: 0 })).toThrow('racha');
    expect(() => mapearResumenHoy({ racha: 1, dias_activos_semana: [], xp_total: null })).toThrow('xp_total');
  });
});

describe('indiceDiaSemana', () => {
  it('lunes es 0 y domingo es 6', () => {
    expect(indiceDiaSemana(new Date(2026, 9, 5, 12))).toBe(0); // lunes 5 de octubre de 2026
    expect(indiceDiaSemana(new Date(2026, 9, 9, 12))).toBe(4); // viernes
    expect(indiceDiaSemana(new Date(2026, 9, 11, 12))).toBe(6); // domingo
  });
});
