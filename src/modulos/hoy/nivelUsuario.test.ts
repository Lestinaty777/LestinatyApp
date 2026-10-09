import { describe, expect, it } from 'vitest';

import { nivelDesdeXp, xpParaSubir } from './nivelUsuario';

describe('xpParaSubir', () => {
  it('crece 20 XP por nivel desde 60', () => {
    expect([1, 2, 3, 4].map(xpParaSubir)).toEqual([60, 80, 100, 120]);
  });
});

describe('nivelDesdeXp', () => {
  it('sin XP es nivel 1 con 0/60', () => {
    expect(nivelDesdeXp(0)).toEqual({ nivel: 1, xpEnNivel: 0, xpRequerido: 60, porcentaje: 0 });
  });

  it('justo antes de subir sigue en el nivel', () => {
    expect(nivelDesdeXp(59)).toMatchObject({ nivel: 1, xpEnNivel: 59, xpRequerido: 60 });
  });

  it('al alcanzar el requerido sube y empieza en 0', () => {
    expect(nivelDesdeXp(60)).toMatchObject({ nivel: 2, xpEnNivel: 0, xpRequerido: 80 });
    expect(nivelDesdeXp(240)).toMatchObject({ nivel: 4, xpEnNivel: 0, xpRequerido: 120 });
  });

  it('calcula el avance dentro del nivel', () => {
    expect(nivelDesdeXp(335)).toEqual({ nivel: 4, xpEnNivel: 95, xpRequerido: 120, porcentaje: 79 });
  });

  it('trata XP negativo o no finito como 0', () => {
    expect(nivelDesdeXp(-5)).toMatchObject({ nivel: 1, xpEnNivel: 0, xpRequerido: 60 });
    expect(nivelDesdeXp(Number.NaN)).toMatchObject({ nivel: 1, xpEnNivel: 0 });
    expect(nivelDesdeXp(Number.POSITIVE_INFINITY)).toMatchObject({ nivel: 1, xpEnNivel: 0 });
  });
});
