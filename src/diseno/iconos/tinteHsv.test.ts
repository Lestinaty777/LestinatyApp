import { describe, expect, it } from 'vitest';
import { calcularMatrizHue } from '../tema/matrizColor';
import { hsvARgb, pesoVerde, rgbAHsv, SKSL_TINTE_HSV, tintarPixelHsv } from './tinteHsv';

const NEUTRO = { delta: 0, saturacion: 1, valorTema: 1, oscuroGlobal: 1 };
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
    const abyss = { ...NEUTRO, valorTema: 0.7 };
    expect(cerca(tintarPixelHsv([1, 1, 1], abyss), [1, 1, 1])).toBe(true);
    expect(rgbAHsv(tintarPixelHsv(VERDE_VIVO, abyss)).v).toBeCloseTo(rgbAHsv(VERDE_VIVO).v * 0.7, 5);
  });

  it('un tinte muy pálido apenas se oscurece (brillos conservados)', () => {
    const palido = [0.92, 0.98, 0.93];
    const v0 = rgbAHsv(palido).v;
    const v1 = rgbAHsv(tintarPixelHsv(palido, { ...NEUTRO, valorTema: 0.7 })).v;
    expect(v1 / v0).toBeGreaterThan(0.95);
  });

  it('valorTema > 1 aclara lo que tiene color (paquetes claros) pero no pasa de blanco ni toca el blanco', () => {
    const claro = { ...NEUTRO, valorTema: 1.3 };
    expect(rgbAHsv(tintarPixelHsv([0.2, 0.5, 0.25], claro)).v).toBeGreaterThan(rgbAHsv([0.2, 0.5, 0.25]).v);
    expect(rgbAHsv(tintarPixelHsv(VERDE_VIVO, { ...NEUTRO, valorTema: 5 })).v).toBeLessThanOrEqual(1);
    expect(cerca(tintarPixelHsv([1, 1, 1], claro), [1, 1, 1])).toBe(true);
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
    for (const nombre of ['imagen', 'delta', 'saturacion', 'valorTema', 'oscuroGlobal', 'soloVerdes']) expect(SKSL_TINTE_HSV).toContain(`uniform ${nombre === 'imagen' ? 'shader' : 'float'} ${nombre};`);
    expect(SKSL_TINTE_HSV).toContain('half4 main(float2 xy)');
  });

  it('usa el mismo umbral de "color pleno" que la referencia', () => {
    expect(SKSL_TINTE_HSV).toContain('hsv.y / 0.6');
  });
});

describe('modo ilustración (soloVerdes)', () => {
  // La roca de Insights: piedra crema (matiz ~40°, casi sin saturación) con musgo lima (~88°).
  const MUSGO = hsvARgb({ h: 88 / 360, s: 0.75, v: 0.81 });
  const PIEDRA = hsvARgb({ h: 40 / 360, s: 0.08, v: 0.92 });
  const rojizo = { ...NEUTRO, delta: -100, soloVerdes: true };

  it('el musgo verde cambia de matiz, la piedra crema no', () => {
    const musgo = rgbAHsv(tintarPixelHsv(MUSGO, rojizo));
    expect(musgo.h * 360).toBeCloseTo(348, 0); // 88° - 100° = -12° = 348°
    expect(cerca(tintarPixelHsv(PIEDRA, rojizo), PIEDRA)).toBe(true);
  });

  it('sin el modo, la piedra sí giraría (el comportamiento de los iconos)', () => {
    expect(cerca(tintarPixelHsv(PIEDRA, { ...NEUTRO, delta: -100 }), PIEDRA, 1e-3)).toBe(false);
  });

  it('el musgo conserva su saturación al cambiar de matiz', () => {
    expect(rgbAHsv(tintarPixelHsv(MUSGO, rojizo)).s).toBeCloseTo(rgbAHsv(MUSGO).s, 5);
  });

  it('los ajustes de saturación y valor del tono también solo tocan lo verde', () => {
    const eclipse = { ...NEUTRO, delta: 134, saturacion: 0.9, valorTema: 0.81, soloVerdes: true };
    expect(cerca(tintarPixelHsv(PIEDRA, eclipse), PIEDRA)).toBe(true);
    expect(rgbAHsv(tintarPixelHsv(MUSGO, eclipse)).v).toBeLessThan(rgbAHsv(MUSGO).v);
  });

  it('pesoVerde: 1 en verdes, 0 en amarillos-naranjas y en azules, con bordes suaves', () => {
    for (const h of [85, 120, 160]) expect(pesoVerde(h), `h=${h}`).toBe(1);
    for (const h of [0, 30, 55, 200, 240, 300]) expect(pesoVerde(h), `h=${h}`).toBe(0);
    expect(pesoVerde(70)).toBeGreaterThan(0);
    expect(pesoVerde(70)).toBeLessThan(1);
    expect(pesoVerde(175)).toBeGreaterThan(0);
    expect(pesoVerde(175)).toBeLessThan(1);
  });

  it('el pasto (100% verde, ~90°) cambia completo', () => {
    const pasto = hsvARgb({ h: 88 / 360, s: 0.78, v: 0.78 });
    expect(rgbAHsv(tintarPixelHsv(pasto, rojizo)).h * 360).toBeCloseTo(348, 0);
  });
});
