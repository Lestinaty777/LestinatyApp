// Rotación de tono (hue) sobre colores hex sueltos — a diferencia de
// MasterChanger (que rota el hue de un PNG ya renderizado en píxeles), aquí
// el "SVG" es datos estructurados: cada color se puede convertir a HSL,
// sumarle el mismo delta de hue, y reconstruirse, preservando la saturación y
// luminosidad relativas de cada tono (así el degradado premium del diseño de
// Figma no se aplana a un solo verde, solo cambia de familia de color).

function hexARgb(hex: string) {
  const limpio = hex.replace('#', '');
  return {
    r: parseInt(limpio.slice(0, 2), 16),
    g: parseInt(limpio.slice(2, 4), 16),
    b: parseInt(limpio.slice(4, 6), 16),
  };
}

function rgbAHsl(r: number, g: number, b: number) {
  const rN = r / 255, gN = g / 255, bN = b / 255;
  const max = Math.max(rN, gN, bN), min = Math.min(rN, gN, bN);
  const l = (max + min) / 2;
  if (max === min) return { h: 0, s: 0, l };
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h: number;
  if (max === rN) h = (gN - bN) / d + (gN < bN ? 6 : 0);
  else if (max === gN) h = (bN - rN) / d + 2;
  else h = (rN - gN) / d + 4;
  return { h: (h / 6) * 360, s, l };
}

function hue2rgb(p: number, q: number, tEntrada: number) {
  let t = tEntrada;
  if (t < 0) t += 1;
  if (t > 1) t -= 1;
  if (t < 1 / 6) return p + (q - p) * 6 * t;
  if (t < 1 / 2) return q;
  if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
  return p;
}

function hslARgb(h: number, s: number, l: number) {
  if (s === 0) {
    const v = Math.round(l * 255);
    return { r: v, g: v, b: v };
  }
  const hN = (((h % 360) + 360) % 360) / 360;
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;
  return {
    r: Math.round(hue2rgb(p, q, hN + 1 / 3) * 255),
    g: Math.round(hue2rgb(p, q, hN) * 255),
    b: Math.round(hue2rgb(p, q, hN - 1 / 3) * 255),
  };
}

function rgbAHex(r: number, g: number, b: number) {
  const canal = (v: number) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0');
  return `#${canal(r)}${canal(g)}${canal(b)}`;
}

export function hueDeHex(hex: string): number {
  const { r, g, b } = hexARgb(hex);
  return rgbAHsl(r, g, b).h;
}

export function rotarHueHex(hex: string, deltaGrados: number): string {
  const { r, g, b } = hexARgb(hex);
  const { h, s, l } = rgbAHsl(r, g, b);
  const rotado = hslARgb(h + deltaGrados, s, l);
  return rgbAHex(rotado.r, rotado.g, rotado.b);
}

/** Rota TODOS los colores de una paleta el mismo delta (color destino - hueReferencia), preservando la relación tonal entre ellos. */
export function rotarPaletaHex(paleta: readonly string[], colorReferencia: string, colorDestino: string): string[] {
  const delta = hueDeHex(colorDestino) - hueDeHex(colorReferencia);
  return paleta.map((hex) => rotarHueHex(hex, delta));
}
