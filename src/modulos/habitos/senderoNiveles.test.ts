import { describe, expect, it } from 'vitest';
import { calcularProgresoMaestria, DIAS_POR_MAPA, RECOMPENSA_COFRE_FINAL } from './senderoNiveles';
import { diasAcumuladosAntesDeNivel } from './diasNivel';

describe('progresión de Senderos', () => {
  it('mantiene los recorridos 1-6 y hace infinito el mapa 7', () => {
    expect(DIAS_POR_MAPA).toEqual({ 1: 3, 2: 7, 3: 12, 4: 18, 5: 25, 6: 33, 7: 42 });
    expect(RECOMPENSA_COFRE_FINAL).toEqual({ 1: 10, 2: 15, 3: 20, 4: 25, 5: 30, 6: 35, 7: 35 });
  });

  it.each([
    [0, { ciclo: 1, diasCompletados: 0, ciclosCompletados: 0 }],
    [41, { ciclo: 1, diasCompletados: 41, ciclosCompletados: 0 }],
    [42, { ciclo: 2, diasCompletados: 0, ciclosCompletados: 1 }],
    [83, { ciclo: 2, diasCompletados: 41, ciclosCompletados: 1 }],
    [84, { ciclo: 3, diasCompletados: 0, ciclosCompletados: 2 }],
  ])('calcula maestría para %i días', (total, esperado) => {
    expect(calcularProgresoMaestria(total)).toEqual({ ...esperado, diasRequeridos: 42, totalDias: total });
  });

  it('mantiene numeración global entre ciclos', () => {
    expect(diasAcumuladosAntesDeNivel(7, 1)).toBe(98);
    expect(diasAcumuladosAntesDeNivel(7, 2)).toBe(140);
  });
});
