import { describe, expect, it } from 'vitest';
import { componerMatrices, calcularMatrizHue, matrizSaturacion } from './matrizColor';
import { crearTonoMaster, TONO_ESMERALDA } from './masterColor';

// master_pack_color reales de public.arboles_paquetes (consultados en Supabase).
const REALES = {
  abyss: '#21232F', celesthia: '#01B0CF', mathist: '#B25FFB', nevalhi: '#C0DFFC', sakura: '#FC70AF', valvery: '#02A0B0',
};

describe('crearTonoMaster', () => {
  it('Esmeralda devuelve las constantes exactas (los verdes que estaban hardcodeados)', () => {
    expect(crearTonoMaster('esmeralda', '#029060')).toBe(TONO_ESMERALDA);
    expect(TONO_ESMERALDA.hue).toBeUndefined();
    expect(TONO_ESMERALDA.glassBase).toBeUndefined();
  });

  it('un color inválido cae al tono Esmeralda en vez de propagar basura', () => {
    expect(crearTonoMaster('mathist', 'morado')).toBe(TONO_ESMERALDA);
  });

  it('Mathist queda en la familia morada y Sakura en la rosa', () => {
    expect(crearTonoMaster('mathist', REALES.mathist).hue).toBeGreaterThan(265);
    expect(crearTonoMaster('mathist', REALES.mathist).hue).toBeLessThan(285);
    expect(crearTonoMaster('sakura', REALES.sakura).hue).toBeGreaterThan(325);
    expect(crearTonoMaster('sakura', REALES.sakura).hue).toBeLessThan(345);
  });

  it('Abyss (casi gris y muy oscuro) baja saturación y oscurece los iconos', () => {
    const abyss = crearTonoMaster('abyss', REALES.abyss);
    expect(abyss.saturacion).toBeLessThan(0.35);
    expect(abyss.oscurecido).toBeLessThan(1);
  });

  it('los paquetes saturados no alteran saturación ni oscurecido', () => {
    const mathist = crearTonoMaster('mathist', REALES.mathist);
    expect(mathist.saturacion).toBe(1);
    expect(mathist.oscurecido).toBe(1);
  });

  it('el acento clampea Abyss y Nevalhi a una luminosidad legible', () => {
    const luminosidad = (hex: string) => {
      const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255);
      return (Math.max(r, g, b) + Math.min(r, g, b)) / 2;
    };
    expect(luminosidad(crearTonoMaster('abyss', REALES.abyss).acento)).toBeGreaterThanOrEqual(0.34);
    expect(luminosidad(crearTonoMaster('nevalhi', REALES.nevalhi).acento)).toBeLessThanOrEqual(0.66);
  });

  it('Celesthia y Valvery comparten familia de hue pero no acento idéntico', () => {
    const celesthia = crearTonoMaster('celesthia', REALES.celesthia);
    const valvery = crearTonoMaster('valvery', REALES.valvery);
    expect(Math.abs((celesthia.hue ?? 0) - (valvery.hue ?? 0))).toBeLessThan(6);
    expect(celesthia.acento).not.toBe(valvery.acento);
  });
});

describe('matrizColor', () => {
  const identidad = [1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0];
  const cercano = (a: number[], b: number[]) => a.every((valor, i) => Math.abs(valor - b[i]) < 1e-9);

  it('saturación 1 es la identidad', () => {
    expect(cercano(matrizSaturacion(1), identidad)).toBe(true);
  });

  it('saturación 0 deja los tres canales iguales (gris)', () => {
    const m = matrizSaturacion(0);
    expect(cercano(m.slice(0, 5), m.slice(5, 10))).toBe(true);
    expect(cercano(m.slice(5, 10), m.slice(10, 15))).toBe(true);
  });

  it('componer con la identidad no cambia la matriz', () => {
    const hue = calcularMatrizHue(75);
    expect(cercano(componerMatrices(hue, identidad), hue)).toBe(true);
    expect(cercano(componerMatrices(identidad, hue), hue)).toBe(true);
  });

  it('rotar 90° dos veces equivale a rotar 180° una vez', () => {
    // Tolerancia laxa: los coeficientes de la matriz de hue (0.143, 0.140,
    // 0.283) son aproximaciones de la especificación SVG, no exactos.
    const dosVeces = componerMatrices(calcularMatrizHue(90), calcularMatrizHue(90));
    const directa = calcularMatrizHue(180);
    expect(dosVeces.every((valor, i) => Math.abs(valor - directa[i]) < 0.02)).toBe(true);
  });
});
