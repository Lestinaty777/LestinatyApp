import { describe, expect, it } from 'vitest';

import { detectarPrimeraVictoria, tipoDePrimeraVictoria } from './primeraVictoria';

describe('detectarPrimeraVictoria', () => {
  it('dispara cuando el XP pasa de 0 a más de 0', () => {
    expect(detectarPrimeraVictoria(0, 10, false)).toBe(true);
  });

  it('no dispara mientras carga, ni al arrancar con XP ya acumulado', () => {
    expect(detectarPrimeraVictoria(undefined, 10, false)).toBe(false);
    expect(detectarPrimeraVictoria(0, undefined, false)).toBe(false);
    expect(detectarPrimeraVictoria(undefined, undefined, false)).toBe(false);
  });

  it('no dispara si ya tenía XP o si sigue en 0', () => {
    expect(detectarPrimeraVictoria(20, 30, false)).toBe(false);
    expect(detectarPrimeraVictoria(0, 0, false)).toBe(false);
  });

  it('solo dispara una vez', () => {
    expect(detectarPrimeraVictoria(0, 10, true)).toBe(false);
  });
});

describe('tipoDePrimeraVictoria', () => {
  const nada = { hechos: 0, total: 1 };
  const uno = { hechos: 1, total: 1 };

  it('identifica qué se completó', () => {
    expect(tipoDePrimeraVictoria({ habitos: uno, tareas: nada, rutinas: nada })).toBe('habito');
    expect(tipoDePrimeraVictoria({ habitos: nada, tareas: uno, rutinas: nada })).toBe('tarea');
    expect(tipoDePrimeraVictoria({ habitos: uno, tareas: uno, rutinas: uno })).toBe('rutina');
    expect(tipoDePrimeraVictoria({ habitos: nada, tareas: nada, rutinas: nada })).toBe('desconocido');
  });
});
