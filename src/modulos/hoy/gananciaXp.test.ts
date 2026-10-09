import { describe, expect, it } from 'vitest';

import { detectarGananciaXp, duracionAvisoXp } from './gananciaXp';

describe('detectarGananciaXp', () => {
  it('no celebra la primera lectura ni mientras carga', () => {
    expect(detectarGananciaXp(undefined, 120)).toBeNull();
    expect(detectarGananciaXp(120, undefined)).toBeNull();
    expect(detectarGananciaXp(undefined, undefined)).toBeNull();
  });

  it('no celebra si el XP no cambia o baja (se desmarcó algo)', () => {
    expect(detectarGananciaXp(50, 50)).toBeNull();
    expect(detectarGananciaXp(50, 40)).toBeNull();
  });

  it('devuelve lo ganado sin subir de nivel', () => {
    expect(detectarGananciaXp(0, 10)).toEqual({ xpGanado: 10, nivelAnterior: 1, nivelNuevo: 1, subioNivel: false });
    expect(detectarGananciaXp(60, 75)).toEqual({ xpGanado: 15, nivelAnterior: 2, nivelNuevo: 2, subioNivel: false });
  });

  it('detecta la subida de nivel al cruzar el umbral (60 XP para el nivel 2)', () => {
    expect(detectarGananciaXp(50, 60)).toEqual({ xpGanado: 10, nivelAnterior: 1, nivelNuevo: 2, subioNivel: true });
    expect(detectarGananciaXp(55, 70)).toMatchObject({ subioNivel: true, nivelNuevo: 2 });
  });

  it('una ganancia grande puede saltar más de un nivel', () => {
    expect(detectarGananciaXp(0, 240)).toEqual({ xpGanado: 240, nivelAnterior: 1, nivelNuevo: 4, subioNivel: true });
  });

  it('ignora valores no finitos', () => {
    expect(detectarGananciaXp(Number.NaN, 10)).toBeNull();
    expect(detectarGananciaXp(0, Number.POSITIVE_INFINITY)).toBeNull();
  });
});

describe('duracionAvisoXp', () => {
  it('subir de nivel se queda más tiempo en pantalla', () => {
    expect(duracionAvisoXp({ subioNivel: true })).toBeGreaterThan(duracionAvisoXp({ subioNivel: false }));
  });
});
