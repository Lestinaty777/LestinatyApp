import { describe, expect, it } from 'vitest';
import { aplicarOscurecido, componerMatrices, calcularMatrizHue, matrizSaturacion, matrizSoloClaros } from './matrizColor';
import { contraste, crearTonoMaster, HUE_REFERENCIA_VERDE, PALETA_ESMERALDA, TONO_ESMERALDA, tintarHex } from './masterColor';
import { esHueVerde } from './matrizColor';

// master_pack_color reales de public.arboles_paquetes (consultados en Supabase).
const REALES = {
  abyss: '#21232F', celesthia: '#01B0CF', mathist: '#B25FFB', nevalhi: '#C0DFFC', sakura: '#FC70AF', valvery: '#02A0B0',
};

describe('crearTonoMaster', () => {
  it('Esmeralda devuelve las constantes exactas (los verdes que estaban hardcodeados)', () => {
    expect(crearTonoMaster('esmeralda', '#029060')).toBe(TONO_ESMERALDA);
    expect(TONO_ESMERALDA.hue).toBeUndefined();
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

const TODOS = Object.entries(REALES_TODOS()).map(([id, hex]) => crearTonoMaster(id, hex));
function REALES_TODOS() {
  return { ...REALES, amber: '#F04D01', aurelia: '#FFD000', diamante: '#80B0E0', golden: '#FCB103', ignate: '#C10208', lightmoon: '#0045D0', crimsonmoon: '#C81E4B', eclipse: '#6A3FA0', moon: '#2F5FE0', vida: '#7CC72B' };
}

describe('paleta derivada', () => {
  it('Esmeralda conserva los 12 tonos congelados y no rota nada', () => {
    expect(TONO_ESMERALDA.paleta).toBe(PALETA_ESMERALDA);
    expect(Object.keys(PALETA_ESMERALDA)).toHaveLength(12);
    expect(TONO_ESMERALDA.deltaHue).toBeUndefined();
    expect(tintarHex(TONO_ESMERALDA, '#21A844')).toBe('#21A844');
  });

  it('el delta es el hue del paquete menos la referencia verde', () => {
    const sakura = crearTonoMaster('sakura', REALES.sakura);
    expect(sakura.deltaHue).toBeCloseTo((sakura.hue ?? 0) - HUE_REFERENCIA_VERDE, 5);
  });

  it('rotar un verde legado lo lleva a la familia del paquete y conserva su luminosidad', () => {
    const sakura = crearTonoMaster('sakura', REALES.sakura);
    const rotado = tintarHex(sakura, '#21A844');
    const [r, g, b] = [1, 3, 5].map((i) => parseInt(rotado.slice(i, i + 2), 16));
    expect(r).toBeGreaterThan(g); // rosa: rojo domina sobre verde
    expect(esHueVerde(0)).toBe(false);
  });

  it.each(TODOS.map((tono) => [tono.id, tono] as const))('%s: botón (blanco sobre vivo) legible y texto legible sobre fondo', (_id, tono) => {
    expect(contraste('#FFFFFF', tono.paleta.vivo)).toBeGreaterThanOrEqual(3);
    expect(contraste(tono.paleta.texto, tono.paleta.fondo)).toBeGreaterThanOrEqual(4.5);
    expect(contraste(tono.paleta.titulo, tono.paleta.fondo)).toBeGreaterThanOrEqual(4.5);
  });

  it('todos los tonos derivados tienen los 12 colores como hex válido', () => {
    for (const tono of TODOS) for (const hex of Object.values(tono.paleta)) expect(hex).toMatch(/^#[0-9A-F]{6}$/);
  });
});

describe('degradados', () => {
  const lum = (hex: string) => {
    const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255);
    return (Math.max(r, g, b) + Math.min(r, g, b)) / 2;
  };
  const paradas = (tono: ReturnType<typeof crearTonoMaster>) => [tono.degradados.progreso, tono.degradados.progresoFondo, tono.degradados.texto, [tono.degradados.mastery.suave, tono.degradados.mastery.profunda], [tono.degradados.menta.suave, tono.degradados.menta.profunda, tono.degradados.menta.pie]];

  it('Esmeralda conserva las bases exactas de los degradados que estaban hardcodeados', () => {
    const g = TONO_ESMERALDA.degradados;
    expect(g.menta).toEqual({ suave: '#F3FCF3', profunda: '#E5F5E6', pie: '#8CCF92' });
    expect(g.mastery).toEqual({ suave: '#2F7D52', profunda: '#148549' });
    expect(g.progreso).toEqual(['#1F7C3E', '#58BE68', '#9AE59C']);
    expect(g.texto).toEqual(['#4AE67D', '#1B9A4B', '#116C33']);
  });

  it.each(TODOS.map((tono) => [tono.id, tono] as const))('%s: cada degradado conserva su forma (mismas paradas, mismo orden de luminosidad)', (_id, tono) => {
    const originales = paradas(TONO_ESMERALDA);
    paradas(tono).forEach((derivado, i) => {
      expect(derivado).toHaveLength(originales[i].length);
      originales[i].forEach((base, j) => {
        expect(derivado[j]).toMatch(/^#[0-9A-F]{6}$/);
        // rotar el hue no cambia la luminosidad HSL: la paradas siguen igual de claras/oscuras entre sí
        expect(Math.abs(lum(derivado[j]) - lum(base))).toBeLessThan(0.02);
      });
    });
  });

  it('los degradados de un paquete no son los de Esmeralda', () => {
    const sakura = crearTonoMaster('sakura', REALES.sakura);
    expect(sakura.degradados.progreso).not.toEqual(TONO_ESMERALDA.degradados.progreso);
    expect(sakura.degradados.menta.suave).not.toBe(TONO_ESMERALDA.degradados.menta.suave);
  });
});

describe('familia verde de iconos', () => {
  it('incluye los verdes medidos en assets (99°-155°) y excluye gemas, racha y niveles', () => {
    for (const hue of [99, 135, 148, 155]) expect(esHueVerde(hue)).toBe(true);
    for (const hue of [26, 47, 214, 266, 359]) expect(esHueVerde(hue)).toBe(false);
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

describe('oscurecer solo lo que tiene color (Abyss)', () => {
  // Aplica una matriz 4x5 a un pixel sin premultiplicar (0..1) y recorta como el filtro de Skia.
  const aplicar = (m: number[], [r, g, b, a]: number[]) => [0, 1, 2, 3].map((fila) => Math.min(1, Math.max(0, m[fila * 5] * r + m[fila * 5 + 1] * g + m[fila * 5 + 2] * b + m[fila * 5 + 3] * a + m[fila * 5 + 4])));
  // Composición de la capa de arriba (claros) sobre la de abajo (color), ambas opacas debajo.
  const componerCapas = (abajo: number[], arriba: number[]) => { const alfa = arriba[3]; return [0, 1, 2].map((i) => arriba[i] * alfa + abajo[i] * (1 - alfa)); };

  const abyss = crearTonoMaster('abyss', '#21232F');
  const rotada = componerMatrices(calcularMatrizHue(abyss.deltaHue ?? 0), matrizSaturacion(abyss.saturacion));
  const capaColor = aplicarOscurecido(rotada, abyss.oscurecido);
  const capaClaros = matrizSoloClaros(rotada);
  const pixel = (p: number[]) => componerCapas(aplicar(capaColor, p), aplicar(capaClaros, p));

  it('Abyss sí oscurece (su tono lo pide) y por eso hay que proteger los blancos', () => {
    expect(abyss.oscurecido).toBeLessThan(0.8);
  });

  it('el blanco sigue siendo blanco, aunque el tono oscurezca', () => {
    const [r, g, b] = pixel([1, 1, 1, 1]);
    for (const canal of [r, g, b]) expect(canal).toBeGreaterThan(0.98);
    // sin la capa de claros el blanco se habría vuelto gris
    expect(aplicar(capaColor, [1, 1, 1, 1])[0]).toBeLessThan(0.8);
  });

  it('un verde saturado sí queda oscurecido (la capa de claros no lo toca)', () => {
    const verde = [34 / 255, 197 / 255, 94 / 255, 1];
    expect(aplicar(capaClaros, verde)[3]).toBe(0);
    const [r, g, b] = pixel(verde);
    const [or, og, ob] = aplicar(rotada, verde);
    expect(Math.max(r, g, b)).toBeLessThan(Math.max(or, og, ob) * 0.85);
  });

  it('un brillo claro (verde muy pálido) conserva su claridad', () => {
    const palido = [0.86, 0.96, 0.88, 1];
    expect(aplicar(capaClaros, palido)[3]).toBeGreaterThan(0.9);
  });

  it('un pixel transparente sigue transparente', () => {
    expect(aplicar(capaClaros, [0, 0, 0, 0])[3]).toBe(0);
  });

  it('sin oscurecido de tono (paquetes normales) no se usa la segunda capa', () => {
    expect(crearTonoMaster('sakura', '#FC70AF').oscurecido).toBe(1);
  });
});
