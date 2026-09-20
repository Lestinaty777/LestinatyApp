// MasterColor: el tono de color asociado a un paquete de árbol (Esmeralda,
// Mathist, Sakura...). Los componentes Master leen un TonoMaster del contexto
// (ver MasterColorContext) en vez de tener verdes hardcodeados — Esmeralda es
// el tono base: sus valores son EXACTAMENTE los verdes que antes vivían
// sueltos en cada componente, así que sin Provider nada cambia.

export type TonoMaster = {
  id: string;
  /** Color de UI del paquete (luminosidad clampeada a un rango legible). */
  acento: string;
  /** Hue destino en grados para tintar iconos PNG. `undefined` = sin tintar (los PNG ya son verdes). */
  hue?: number;
  /** 1 = sin cambio. Baja en paquetes casi grises (Abyss) para no dejar iconos saturados. */
  saturacion: number;
  /** 1 = sin cambio. Baja en paquetes muy oscuros. */
  oscurecido: number;
  /** Color base para teñir MasterGlass. `undefined` = menta de siempre. */
  glassBase?: string;
  fondo: string;
  chipActivo: string;
  chipTexto: string;
  marcoIcono: { bordeInicio: string; bordeFin: string; degradadoInicio: string; degradadoFin: string };
  degradadoTarjeta: { inicio: string; fin: string };
  /** Píldora "Actual" de la ruta de niveles. */
  etiquetaActual: { fondo: string; texto: string };
  /** Textos y trazos de la tarjeta de hábito (antes #145C37 / #4A7F5D / #397250 / #367651 / #25884C / #0D6238). */
  tarjeta: { tinta: string; tintaMedia: string; tintaSuave: string; tintaDia: string; trazo: string; boton: string };
};

export const ID_TONO_ESMERALDA = 'esmeralda';

export const TONO_ESMERALDA: TonoMaster = {
  id: ID_TONO_ESMERALDA,
  acento: '#029060', // master_pack_color real de 'esmeralda' en public.arboles_paquetes
  saturacion: 1,
  oscurecido: 1,
  fondo: '#F3FAF0',
  chipActivo: '#2F7D52',
  chipTexto: '#4A7F5D',
  marcoIcono: { bordeInicio: '#C5F7B6', bordeFin: '#539C68', degradadoInicio: '#F4FFF1', degradadoFin: '#B8EDB0' },
  degradadoTarjeta: { inicio: '#F4FFF1', fin: '#B8EDB0' },
  etiquetaActual: { fondo: '#D8F6D1', texto: '#19673A' },
  tarjeta: { tinta: '#145C37', tintaMedia: '#4A7F5D', tintaSuave: '#397250', tintaDia: '#367651', trazo: '#25884C', boton: '#0D6238' },
};

type Hsl = { h: number; s: number; l: number };

function hexARgb(hex: string) {
  const limpio = hex.replace('#', '');
  return { r: parseInt(limpio.slice(0, 2), 16), g: parseInt(limpio.slice(2, 4), 16), b: parseInt(limpio.slice(4, 6), 16) };
}

function hexAHsl(hex: string): Hsl {
  const { r, g, b } = hexARgb(hex);
  const rn = r / 255, gn = g / 255, bn = b / 255;
  const max = Math.max(rn, gn, bn), min = Math.min(rn, gn, bn);
  const l = (max + min) / 2;
  if (max === min) return { h: 0, s: 0, l };
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  const h = max === rn ? (gn - bn) / d + (gn < bn ? 6 : 0) : max === gn ? (bn - rn) / d + 2 : (rn - gn) / d + 4;
  return { h: h * 60, s, l };
}

function hslAHex({ h, s, l }: Hsl): string {
  const a = s * Math.min(l, 1 - l);
  const canal = (n: number) => {
    const k = (n + h / 30) % 12;
    return Math.round(255 * (l - a * Math.max(-1, Math.min(k - 3, 9 - k, 1)))).toString(16).padStart(2, '0');
  };
  return `#${canal(0)}${canal(8)}${canal(4)}`.toUpperCase();
}

function mezclar(origen: string, destino: string, proporcion: number): string {
  const a = hexARgb(origen), b = hexARgb(destino);
  const canal = (x: number, y: number) => Math.round(x + (y - x) * proporcion).toString(16).padStart(2, '0');
  return `#${canal(a.r, b.r)}${canal(a.g, b.g)}${canal(a.b, b.b)}`.toUpperCase();
}

const limitar = (valor: number, minimo: number, maximo: number) => Math.min(maximo, Math.max(minimo, valor));

// Hex estándar (#RRGGBB) — descarta cualquier otra cosa para no propagar un
// color inválido a Skia/SVG.
const HEX_VALIDO = /^#[0-9a-fA-F]{6}$/;

/**
 * Deriva el tono de UI de un paquete desde su `master_pack_color`. Esmeralda
 * no se deriva (tiene constantes exactas): un id 'esmeralda' devuelve TONO_ESMERALDA.
 */
export function crearTonoMaster(id: string, masterPackColor: string): TonoMaster {
  if (id === ID_TONO_ESMERALDA || !HEX_VALIDO.test(masterPackColor)) return TONO_ESMERALDA;
  const original = hexAHsl(masterPackColor);
  // Mismo clamp que colorSeguroUi: colores casi negros (Abyss) o casi blancos
  // (Nevalhi) no sirven tal cual como acento de texto/botones.
  const acento = hslAHex({ h: original.h, s: original.s, l: limitar(original.l, 0.35, 0.65) });
  return {
    id,
    acento,
    hue: original.h,
    // Los PNG base son muy saturados: un paquete casi gris necesita bajar la saturación.
    saturacion: limitar(original.s / 0.85, 0.15, 1),
    oscurecido: original.l < 0.3 ? 0.55 + original.l : 1,
    glassBase: acento,
    fondo: mezclar(acento, '#FFFFFF', 0.94),
    chipActivo: mezclar(acento, '#000000', 0.25),
    chipTexto: mezclar(acento, '#000000', 0.35),
    marcoIcono: {
      bordeInicio: mezclar(acento, '#FFFFFF', 0.7),
      bordeFin: mezclar(acento, '#000000', 0.1),
      degradadoInicio: mezclar(acento, '#FFFFFF', 0.95),
      degradadoFin: mezclar(acento, '#FFFFFF', 0.7),
    },
    degradadoTarjeta: { inicio: mezclar(acento, '#FFFFFF', 0.95), fin: mezclar(acento, '#FFFFFF', 0.7) },
    etiquetaActual: { fondo: mezclar(acento, '#FFFFFF', 0.8), texto: mezclar(acento, '#000000', 0.45) },
    tarjeta: {
      tinta: mezclar(acento, '#000000', 0.5),
      tintaMedia: mezclar(acento, '#000000', 0.3),
      tintaSuave: mezclar(acento, '#000000', 0.4),
      tintaDia: mezclar(acento, '#000000', 0.38),
      trazo: mezclar(acento, '#000000', 0.15),
      boton: mezclar(acento, '#000000', 0.45),
    },
  };
}
