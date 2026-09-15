import { describe, expect, it } from 'vitest';

import { hueDeHex, rotarHueHex, rotarPaletaHex } from './colorHsl';

describe('rotarHueHex', () => {
  it('deja el color igual con un delta de 0', () => {
    expect(rotarHueHex('#21A844', 0).toLowerCase()).toBe('#21a844');
  });

  it('rota el hue manteniendo saturación y luminosidad (verde -> azul con +240°)', () => {
    // #21A844 es un verde puro (hue ~130°); +240° cae en el azul (~10°, con wraparound).
    const rotado = rotarHueHex('#21A844', 240);
    expect(hueDeHex(rotado)).toBeCloseTo((hueDeHex('#21A844') + 240) % 360, 0);
  });

  it('es reversible: rotar y luego rotar el delta contrario vuelve al color original', () => {
    const original = '#44B042';
    const ida = rotarHueHex(original, 90);
    const vuelta = rotarHueHex(ida, -90);
    expect(vuelta.toLowerCase()).toBe(original.toLowerCase());
  });
});

describe('rotarPaletaHex', () => {
  it('no cambia nada si el color destino es igual al de referencia', () => {
    const paleta = ['#DEFCDD', '#B2EEB1', '#44B042'];
    expect(rotarPaletaHex(paleta, '#21A844', '#21A844').map((c) => c.toLowerCase())).toEqual(paleta.map((c) => c.toLowerCase()));
  });

  it('preserva el delta de hue entre todos los colores de la paleta', () => {
    const paleta = ['#DEFCDD', '#B2EEB1', '#44B042', '#248723'];
    const rotada = rotarPaletaHex(paleta, '#21A844', '#3B6FE0');
    const deltaEsperado = hueDeHex('#3B6FE0') - hueDeHex('#21A844');
    paleta.forEach((original, indice) => {
      const deltaReal = hueDeHex(rotada[indice]) - hueDeHex(original);
      // Normaliza a [-180,180] para comparar sin problemas de wraparound de 0/360.
      const normaliza = (v: number) => ((v + 540) % 360) - 180;
      expect(normaliza(deltaReal)).toBeCloseTo(normaliza(deltaEsperado), 0);
    });
  });
});
