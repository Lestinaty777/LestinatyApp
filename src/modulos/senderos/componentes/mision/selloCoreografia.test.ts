import { describe, expect, it } from 'vitest';

import { ACTOS_SELLO, generarGeometriaSello, giroSello, pulsosSello, seg, ventanaCapa, VUELTAS_SELLO } from './selloCoreografia';

describe('coreografía del sello', () => {
  it('los actos cubren los 7 segundos sin huecos', () => {
    const actos = Object.values(ACTOS_SELLO);
    expect(actos[0][0]).toBe(0);
    expect(actos[actos.length - 1][1]).toBe(1);
    for (let i = 1; i < actos.length; i += 1) expect(actos[i][0]).toBeCloseTo(actos[i - 1][1]);
  });

  it('las figuras se dibujan una tras otra dentro del trazado', () => {
    const total = 4;
    const ventanas = Array.from({ length: total }, (_, i) => ventanaCapa(i, total));
    for (let i = 1; i < total; i += 1) expect(ventanas[i][0]).toBeGreaterThan(ventanas[i - 1][0]);
    expect(ventanas[0][0]).toBeCloseTo(ACTOS_SELLO.trazado[0]);
    for (const [, fin] of ventanas) expect(fin).toBeLessThanOrEqual(ACTOS_SELLO.trazado[1] + 1e-9);
  });

  it('el giro está quieto hasta la resonancia, acelera y termina en vueltas enteras', () => {
    expect(giroSello(0)).toBe(0);
    expect(giroSello(ACTOS_SELLO.resonancia[0])).toBe(0);
    expect(giroSello(1)).toBeCloseTo(VUELTAS_SELLO * Math.PI * 2);
    const tramo1 = giroSello(seg(4)) - giroSello(seg(3.5));
    const tramo2 = giroSello(seg(6.5)) - giroSello(seg(6));
    expect(tramo2).toBeGreaterThan(tramo1);
  });

  it('las figuras terminan alineadas: velocidades enteras en toda semilla', () => {
    for (let i = 0; i < 60; i += 1) {
      const { capas } = generarGeometriaSello(`hábito ${i}`);
      expect(capas.length).toBeGreaterThanOrEqual(2);
      for (const capa of capas) expect(Number.isInteger(capa.velocidad)).toBe(true);
    }
  });

  it('la misma semilla da la misma geometría', () => {
    expect(generarGeometriaSello('Meditar')).toEqual(generarGeometriaSello('Meditar'));
  });

  it('los pulsos van en orden, dentro de la carga, con silencio al final', () => {
    const pulsos = pulsosSello(3);
    for (let i = 1; i < pulsos.length; i += 1) expect(pulsos[i].en).toBeGreaterThanOrEqual(pulsos[i - 1].en);
    expect(pulsos[0].en).toBeGreaterThan(0);
    expect(Math.max(...pulsos.map((p) => p.en))).toBeLessThan(ACTOS_SELLO.silencio[0]);
  });
});
