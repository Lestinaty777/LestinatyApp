import { describe, expect, it } from 'vitest';

import { hueDeHex } from '../senderos/algoritmo/colorHsl';
import { NACAR_POR_PAQUETE, tonosNacarMandala } from './nacarMandala';

function saturacion(hex: string) {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255);
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  return max === min ? 0 : (max - min) / (1 - Math.abs(2 * l - 1));
}

// Distancia angular entre dos matices, 0–180.
function distanciaHue(a: number, b: number) {
  const d = Math.abs(a - b) % 360;
  return d > 180 ? 360 - d : d;
}

describe('tonosNacarMandala', () => {
  it('cubre los 17 paquetes de hábito', () => {
    expect(Object.keys(NACAR_POR_PAQUETE)).toHaveLength(17);
  });

  it('Esmeralda abre hacia el amarillo', () => {
    const { tonoA } = tonosNacarMandala('esmeralda', '#029060');
    expect(hueDeHex(tonoA)).toBeGreaterThan(55);
    expect(hueDeHex(tonoA)).toBeLessThan(85);
  });

  it('los dorados nunca llegan al verde', () => {
    for (const id of ['aurelia', 'golden', 'amber']) {
      const { tonoA, tonoB } = tonosNacarMandala(id, NACAR_POR_PAQUETE[id].color);
      for (const tono of [tonoA, tonoB]) expect(distanciaHue(hueDeHex(tono), 120)).toBeGreaterThan(50);
    }
  });

  it('Abyss, casi gris, igual tiene reflejos con color', () => {
    const { tonoA, tonoB } = tonosNacarMandala('abyss', '#21232F');
    expect(saturacion(tonoA)).toBeGreaterThan(0.4);
    expect(saturacion(tonoB)).toBeGreaterThan(0.4);
  });

  it('los verde-N gratuitos usan el nácar de Esmeralda', () => {
    expect(tonosNacarMandala('verde-3', '#1fb155').tonoA).toBe(tonosNacarMandala('esmeralda', '#1fb155').tonoA);
  });

  it('sin id reconoce el paquete por su color', () => {
    expect(tonosNacarMandala(null, '#B25FFB')).toEqual(tonosNacarMandala('mathist', '#B25FFB'));
  });

  it('el canto de un paquete muy claro se oscurece para leerse sobre el mapa', () => {
    const { canto } = tonosNacarMandala('nevalhi', '#C0DFFC');
    const luminosidad = (Math.max(...[1, 3, 5].map((i) => parseInt(canto.slice(i, i + 2), 16))) + Math.min(...[1, 3, 5].map((i) => parseInt(canto.slice(i, i + 2), 16)))) / 510;
    expect(luminosidad).toBeLessThanOrEqual(0.6);
  });
});
