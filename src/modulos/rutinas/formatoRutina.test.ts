import { describe, expect, it } from 'vitest';

import { diasAbreviados, leerObjetivo } from './formatoRutina';

const etiqueta = (dia: number) => 'LMXJVSD'[dia - 1];

describe('diasAbreviados', () => {
  it('abrevia y ordena los días', () => {
    expect(diasAbreviados([5, 1, 3], etiqueta)).toBe('L X V');
  });

  it('null para todos los días o sin días', () => {
    expect(diasAbreviados([1, 2, 3, 4, 5, 6, 7], etiqueta)).toBeNull();
    expect(diasAbreviados(null, etiqueta)).toBeNull();
    expect(diasAbreviados([], etiqueta)).toBeNull();
  });
});

describe('leerObjetivo', () => {
  it('acepta enteros y decimales con coma o punto', () => {
    expect(leerObjetivo('10')).toBe(10);
    expect(leerObjetivo(' 2,5 ')).toBe(2.5);
    expect(leerObjetivo('0.5')).toBe(0.5);
  });

  it('rechaza vacío, cero, negativos, texto y valores enormes', () => {
    for (const texto of ['', '0', '-3', 'abc', '10000', 'Infinity']) expect(leerObjetivo(texto)).toBeNull();
  });
});
