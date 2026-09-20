import { describe, expect, it } from 'vitest';
import { ESCALA_ESMERALDA } from './escalaEsmeralda';
import { crearTonoMaster, TONO_ESMERALDA } from './masterColor';

const FAMILIAS = ['lima', 'hoja', 'jade', 'menta', 'musgo'] as const;
const planos = (escala: Record<string, Record<string, string>>) => Object.entries(escala).flatMap(([familia, tonos]) => Object.entries(tonos).map(([clave, hex]) => ({ familia, clave, hex })));

// L* (CIELAB) de un hex — el número que va en el nombre de cada tono.
function luminosidadLab(hex: string) {
  const canal = (i: number) => { const c = parseInt(hex.slice(i, i + 2), 16) / 255; return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; };
  const y = 0.2126 * canal(1) + 0.7152 * canal(3) + 0.0722 * canal(5);
  return 116 * (y > 0.008856 ? Math.cbrt(y) : 7.787 * y + 16 / 116) - 16;
}

function hexesDe(valor: unknown): string[] {
  if (typeof valor === 'string') return valor.startsWith('#') ? [valor.toUpperCase()] : [];
  if (Array.isArray(valor)) return valor.flatMap(hexesDe);
  if (valor && typeof valor === 'object') return Object.values(valor).flatMap(hexesDe);
  return [];
}

describe('escala Esmeralda', () => {
  const tonos = planos(ESCALA_ESMERALDA);

  it('tiene las 5 familias y cerca de cien tonos, todos hex válidos en mayúsculas', () => {
    expect(Object.keys(ESCALA_ESMERALDA)).toEqual([...FAMILIAS]);
    expect(tonos.length).toBeGreaterThanOrEqual(90);
    for (const { hex } of tonos) expect(hex).toMatch(/^#[0-9A-F]{6}$/);
  });

  it('ningún color se repite en la escala', () => {
    const hexes = tonos.map((t) => t.hex);
    expect(new Set(hexes).size).toBe(hexes.length);
  });

  it('el número del nombre es la luminosidad L* real del color (vigila ediciones a mano)', () => {
    for (const { clave, hex } of tonos) {
      const numero = Number(/^l(\d+)/.exec(clave)?.[1]);
      expect(Math.abs(numero - luminosidadLab(hex)), `${clave} ${hex}`).toBeLessThanOrEqual(1);
    }
  });

  it('todos los tokens del tono Esmeralda (paleta, degradados, tarjeta...) son miembros exactos de la escala', () => {
    const miembros = new Set(tonos.map((t) => t.hex));
    const { escala: _escala, ...resto } = TONO_ESMERALDA;
    const fuera = hexesDe(resto).filter((hex) => !miembros.has(hex));
    expect(fuera).toEqual([]);
  });

  it('otro paquete rota la MISMA escala: mismas familias y nombres, otros colores', () => {
    const sakura = crearTonoMaster('sakura', '#FC70AF').escala;
    expect(Object.keys(sakura)).toEqual([...FAMILIAS]);
    for (const familia of FAMILIAS) expect(Object.keys(sakura[familia])).toEqual(Object.keys(ESCALA_ESMERALDA[familia]));
    const rotados = planos(sakura);
    for (const { hex } of rotados) expect(hex).toMatch(/^#[0-9A-F]{6}$/);
    expect(rotados.map((t) => t.hex)).not.toEqual(tonos.map((t) => t.hex));
  });

  it('rotar conserva la luminosidad de cada tono (la riqueza tonal no se aplana)', () => {
    const rotada = planos(crearTonoMaster('mathist', '#B25FFB').escala);
    const hslL = (hex: string) => { const c = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255); return (Math.max(...c) + Math.min(...c)) / 2; };
    rotada.forEach(({ hex }, i) => expect(Math.abs(hslL(hex) - hslL(tonos[i].hex))).toBeLessThan(0.02));
  });
});
