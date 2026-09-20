import { describe, expect, it } from 'vitest';
import { calcularMatrizHue } from '../tema/matrizColor';
import { hsvARgb, rgbAHsv, SKSL_TINTE_HSV, tintarPixelHsv } from './tinteHsv';

const NEUTRO = { delta: 0, saturacion: 1, oscuroTema: 1, oscuroGlobal: 1 };
const VERDE_VIVO = [34 / 255, 197 / 255, 94 / 255]; // #22C55E
const cerca = (a: number[], b: number[], tolerancia = 1e-6) => a.every((valor, i) => Math.abs(valor - b[i]) < tolerancia);

// La rotación por matriz que se usaba antes (sin recortar el desplazamiento: solo la parte lineal 3x3).
function conMatriz(delta: number, [r, g, b]: number[]) {
  const m = calcularMatrizHue(delta);
  return [0, 1, 2].map((fila) => Math.min(1, Math.max(0, m[fila * 5] * r + m[fila * 5 + 1] * g + m[fila * 5 + 2] * b)));
}

describe('tintarPixelHsv', () => {
  it('sin cambios pedidos devuelve el mismo color', () => {
    for (const rgb of [VERDE_VIVO, [1, 1, 1], [0, 0, 0], [0.5, 0.5, 0.5], [0.9, 0.3, 0.1]]) expect(cerca(tintarPixelHsv(rgb, NEUTRO), rgb)).toBe(true);
  });

  it('rgb -> hsv -> rgb es reversible', () => {
    for (const rgb of [VERDE_VIVO, [0.2, 0.4, 0.9], [0.9, 0.9, 0.1]]) expect(cerca(hsvARgb(rgbAHsv(rgb)), rgb)).toBe(true);
  });

  it('un verde vivo pasa a rojo IGUAL de vivo (la matriz lo dejaba pastel)', () => {
    const original = rgbAHsv(VERDE_VIVO);
    const deltaARojo = -142;
    const nuevo = rgbAHsv(tintarPixelHsv(VERDE_VIVO, { ...NEUTRO, delta: deltaARojo }));
    expect(nuevo.s).toBeCloseTo(original.s, 5);
    expect(nuevo.v).toBeCloseTo(original.v, 5);
    // el mismo cambio con la matriz de color baja la saturación de 0.83 a ~0.54 (rojo pastel)
    expect(rgbAHsv(conMatriz(deltaARojo, VERDE_VIVO)).s).toBeLessThan(0.6);
  });

  it('conserva la saturación en todos los destinos, no solo en el rojo', () => {
    const original = rgbAHsv(VERDE_VIVO).s;
    for (const delta of [-142, -105, 90, 140, 193]) {
      expect(rgbAHsv(tintarPixelHsv(VERDE_VIVO, { ...NEUTRO, delta })).s, `delta ${delta}`).toBeCloseTo(original, 5);
    }
  });

  it('la matriz apagaba rojo, azul, rosa y morado (el naranja no: su luminancia se parece a la del verde)', () => {
    const original = rgbAHsv(VERDE_VIVO).s;
    for (const delta of [-142, 90, 140, 193]) expect(rgbAHsv(conMatriz(delta, VERDE_VIVO)).s, `matriz ${delta}`).toBeLessThan(original - 0.15);
    expect(rgbAHsv(conMatriz(-105, VERDE_VIVO)).s).toBeGreaterThan(original - 0.1);
  });

  it('llega al matiz pedido: el verde (120°) rotado 120° cae en azul', () => {
    const { h } = rgbAHsv(tintarPixelHsv([0, 1, 0], { ...NEUTRO, delta: 120 }));
    expect(h * 360).toBeCloseTo(240, 3);
  });

  it('blancos y grises no cambian de matiz ni se tiñen', () => {
    for (const gris of [[1, 1, 1], [0.6, 0.6, 0.6], [0.1, 0.1, 0.1]]) expect(cerca(tintarPixelHsv(gris, { ...NEUTRO, delta: 200 }), gris)).toBe(true);
  });

  it('el oscurecido del tono no toca el blanco pero sí oscurece un verde vivo', () => {
    const abyss = { ...NEUTRO, oscuroTema: 0.7 };
    expect(cerca(tintarPixelHsv([1, 1, 1], abyss), [1, 1, 1])).toBe(true);
    expect(rgbAHsv(tintarPixelHsv(VERDE_VIVO, abyss)).v).toBeCloseTo(rgbAHsv(VERDE_VIVO).v * 0.7, 5);
  });

  it('un tinte muy pálido apenas se oscurece (brillos conservados)', () => {
    const palido = [0.92, 0.98, 0.93];
    const v0 = rgbAHsv(palido).v;
    const v1 = rgbAHsv(tintarPixelHsv(palido, { ...NEUTRO, oscuroTema: 0.7 })).v;
    expect(v1 / v0).toBeGreaterThan(0.95);
  });

  it('el oscurecido global sí afecta al blanco (es el explícito de la API vieja)', () => {
    expect(tintarPixelHsv([1, 1, 1], { ...NEUTRO, oscuroGlobal: 0.8 })[0]).toBeCloseTo(0.8, 6);
  });

  it('la saturación escala la del píxel (Abyss casi gris)', () => {
    const s = rgbAHsv(tintarPixelHsv(VERDE_VIVO, { ...NEUTRO, saturacion: 0.25 })).s;
    expect(s).toBeCloseTo(rgbAHsv(VERDE_VIVO).s * 0.25, 5);
  });
});

describe('SKSL_TINTE_HSV', () => {
  it('declara los uniforms que MasterChanger le pasa y una función main', () => {
    for (const nombre of ['imagen', 'delta', 'saturacion', 'oscuroTema', 'oscuroGlobal']) expect(SKSL_TINTE_HSV).toContain(`uniform ${nombre === 'imagen' ? 'shader' : 'float'} ${nombre};`);
    expect(SKSL_TINTE_HSV).toContain('half4 main(float2 xy)');
  });

  it('usa el mismo umbral de "color pleno" que la referencia', () => {
    expect(SKSL_TINTE_HSV).toContain('hsv.y / 0.6');
  });
});
