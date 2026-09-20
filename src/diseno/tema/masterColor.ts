// MasterColor: el tono de color asociado a un paquete de árbol (Esmeralda,
// Mathist, Sakura...). Los componentes Master leen un TonoMaster del contexto
// (ver MasterColorContext) en vez de tener verdes hardcodeados.
//
// Esmeralda es el tono base y sus valores son EXACTAMENTE los verdes que antes
// vivían sueltos en cada componente, así que sin Provider nada cambia. Los
// demás paquetes no tienen tabla propia: se derivan de Esmeralda rotando el
// hue de cada color el mismo delta (hue del paquete − HUE_REFERENCIA_VERDE) y
// conservando su luminosidad — igual que los iconos PNG (ver MasterChanger).

import { ESCALA_ESMERALDA, type EscalaMaster } from './escalaEsmeralda';

export type PaletaMaster = {
  /** Acento medio: trazos, acentos. */
  medio: string;
  /** Texto suave: chevrons, texto secundario. */
  suave: string;
  /** Texto principal (casi negro verdoso). */
  texto: string;
  /** Acento vivo: botones, switches. */
  vivo: string;
  /** Fondo de pantalla. */
  fondo: string;
  /** Verde profundo: títulos. */
  titulo: string;
  /** Borde o relleno pálido. */
  borde: string;
  /** Verde brillante: progreso, énfasis. */
  brillante: string;
  /** Gris verdoso: deshabilitados. */
  gris: string;
  /** Menta: detalles fríos. */
  menta: string;
  /** Lima pálido: píldoras, chips. */
  lima: string;
  /** Verde neón: destellos. */
  neon: string;
};

/**
 * Degradados de los componentes Master. Se guardan como las BASES de cada
 * degradado (no como un degradado ya armado por paquete): MasterGlass sigue
 * construyendo el suyo mezclando estas bases con blanco/negro, así el
 * degradado de un paquete conserva exactamente la forma del de Esmeralda.
 */
export type DegradadosMaster = {
  /** Bases del cristal menta de MasterGlass: `pie` es el color hacia el que vira la parte baja. */
  menta: { suave: string; profunda: string; pie: string };
  /** Cristal "mastery" (verde semi-oscuro): MasterGlass mastery y MasterKicker. */
  mastery: { suave: string; profunda: string };
  /** Heptágono de MasterGlass: borde normal, y borde/centro/pie de su variante mastery. */
  heptagono: { borde: string; bordeMastery: string; centroMastery: string; pieMastery: string };
  /** Relleno líquido de MasterProgressbar. */
  progreso: [string, string, string];
  /** Pista de MasterProgressbar. */
  progresoFondo: [string, string];
  /** Texto con degradado de MasterText. */
  texto: [string, string, string];
  /** Color sólido de respaldo de MasterText. */
  textoSolido: string;
  /** Sombra del cristal (color base; el alfa se aplica al usarla). */
  sombra: string;
};

export type TonoMaster = {
  id: string;
  /** Color de UI del paquete (luminosidad clampeada a un rango legible). */
  acento: string;
  /** Hue absoluto del paquete en grados: para teñidos forzados (`MasterIcon hueDestino`). `undefined` en Esmeralda. */
  hue?: number;
  /** Rotación relativa respecto a Esmeralda en grados (hue del paquete − HUE_REFERENCIA_VERDE). `undefined` en Esmeralda = sin rotar. */
  deltaHue?: number;
  /** 1 = sin cambio. Baja en paquetes casi grises (Abyss) para no dejar colores saturados. */
  saturacion: number;
  /** 1 = sin cambio. Baja en paquetes muy oscuros. */
  oscurecido: number;
  /** Los verdes de la UI (escala Esmeralda), rotados al paquete. */
  escala: EscalaMaster;
  /** Los 12 tonos de la app, por rol. */
  paleta: PaletaMaster;
  /** Bases de los degradados de los componentes Master. */
  degradados: DegradadosMaster;
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

// Hue del verde que más se usa (#25884C) y donde se concentran los iconos PNG
// (mediana 135°, la mayoría entre 140° y 149°). Es el "cero" de la rotación.
export const HUE_REFERENCIA_VERDE = 142;

// 12 tonos congelados: los ~164 verdes hardcodeados de la app agrupados por
// similitud perceptual (k-means en Lab, movimiento medio ΔE ≈ 5).
export const PALETA_ESMERALDA: PaletaMaster = {
  medio: '#25884C', suave: '#5B8C65', texto: '#1A3320', vivo: '#21A844',
  fondo: '#F7FDF7', titulo: '#145C37', borde: '#D5F2D7', brillante: '#22C55E',
  gris: '#648170', menta: '#34D399', lima: '#B4DC9B', neon: '#34D946',
};

type TokensDerivables = Pick<TonoMaster, 'escala' | 'paleta' | 'degradados' | 'fondo' | 'chipActivo' | 'chipTexto' | 'marcoIcono' | 'degradadoTarjeta' | 'etiquetaActual' | 'tarjeta'>;

const TOKENS_ESMERALDA: TokensDerivables = {
  escala: ESCALA_ESMERALDA,
  paleta: PALETA_ESMERALDA,
  degradados: {
    menta: { suave: '#F3FCF3', profunda: '#E5F5E6', pie: '#8CCF92' },
    mastery: { suave: '#2F7D52', profunda: '#148549' },
    heptagono: { borde: '#CDEFCF', bordeMastery: '#1D8D48', centroMastery: '#42B766', pieMastery: '#17733B' },
    progreso: ['#1F7C3E', '#58BE68', '#9AE59C'],
    progresoFondo: ['#EDFAED', '#F4FFEA'],
    texto: ['#4AE67D', '#1B9A4B', '#116C33'],
    textoSolido: '#1B8742',
    sombra: '#0B7432',
  },
  fondo: '#F3FAF0',
  chipActivo: '#2F7D52',
  chipTexto: '#4A7F5D',
  marcoIcono: { bordeInicio: '#C5F7B6', bordeFin: '#539C68', degradadoInicio: '#F4FFF1', degradadoFin: '#B8EDB0' },
  degradadoTarjeta: { inicio: '#F4FFF1', fin: '#B8EDB0' },
  etiquetaActual: { fondo: '#D8F6D1', texto: '#19673A' },
  tarjeta: { tinta: '#145C37', tintaMedia: '#4A7F5D', tintaSuave: '#397250', tintaDia: '#367651', trazo: '#25884C', boton: '#0D6238' },
};

export const TONO_ESMERALDA: TonoMaster = {
  id: ID_TONO_ESMERALDA,
  acento: '#029060', // master_pack_color real de 'esmeralda' en public.arboles_paquetes
  saturacion: 1,
  oscurecido: 1,
  ...TOKENS_ESMERALDA,
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

const limitar = (valor: number, minimo: number, maximo: number) => Math.min(maximo, Math.max(minimo, valor));

/** Rota el hue de `hex` `delta` grados y escala su saturación; la luminosidad no cambia. */
function rotarHex(hex: string, delta: number, saturacion: number): string {
  const { h, s, l } = hexAHsl(hex);
  return hslAHex({ h: (((h + delta) % 360) + 360) % 360, s: limitar(s * saturacion, 0, 1), l });
}

/**
 * Lleva un verde hardcodeado (de los ~164 que hay en la app) al tono activo:
 * misma rotación que usa la paleta. En Esmeralda devuelve el mismo color.
 */
export function tintarHex(tono: TonoMaster, hex: string): string {
  return tono.deltaHue === undefined ? hex : rotarHex(hex, tono.deltaHue, tono.saturacion);
}

/** Forma exacta de un rgba(): la piden tipos estrictos como el ColorProp de los widgets de Android. */
export type ColorRgba = `rgba(${number}, ${number}, ${number}, ${number})`;

/** `rgba(r, g, b, alfa)` de un color hex: para reemplazar los rgba() verdes con el color exacto del sistema. */
export function conAlfa(hex: string, alfa: number): ColorRgba {
  const { r, g, b } = hexARgb(hex);
  return `rgba(${r}, ${g}, ${b}, ${alfa})`;
}

function mapearHex<T>(valor: T, transformar: (hex: string) => string): T {
  if (typeof valor === 'string') return (valor.startsWith('#') ? transformar(valor) : valor) as T;
  if (Array.isArray(valor)) return valor.map((hijo) => mapearHex(hijo, transformar)) as T;
  if (valor && typeof valor === 'object') {
    return Object.fromEntries(Object.entries(valor).map(([clave, hijo]) => [clave, mapearHex(hijo, transformar)])) as T;
  }
  return valor;
}

function luminancia(hex: string) {
  const canal = (v: number) => { const c = v / 255; return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; };
  const { r, g, b } = hexARgb(hex);
  return 0.2126 * canal(r) + 0.7152 * canal(g) + 0.0722 * canal(b);
}

export function contraste(a: string, b: string) {
  const x = luminancia(a), y = luminancia(b);
  return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
}

// Oscurece `color` de a 1% de luminosidad hasta llegar al contraste mínimo
// contra `fondo`. Rotar el hue conserva la luminosidad HSL, pero no la
// percibida: un verde vivo rotado a amarillo deja de leerse con texto blanco.
function oscurecerHastaContraste(color: string, fondo: string, minimo: number): string {
  let actual = hexAHsl(color);
  let resultado = color;
  for (let i = 0; i < 80 && contraste(resultado, fondo) < minimo && actual.l > 0.04; i++) {
    actual = { ...actual, l: actual.l - 0.01 };
    resultado = hslAHex(actual);
  }
  return resultado;
}

function asegurarContrastes(paleta: PaletaMaster): PaletaMaster {
  return {
    ...paleta,
    vivo: oscurecerHastaContraste(paleta.vivo, '#FFFFFF', 3), // botón con texto blanco
    suave: oscurecerHastaContraste(paleta.suave, paleta.fondo, 3),
    titulo: oscurecerHastaContraste(paleta.titulo, paleta.fondo, 4.5),
    texto: oscurecerHastaContraste(paleta.texto, paleta.fondo, 4.5),
  };
}

// Hex estándar (#RRGGBB) — descarta cualquier otra cosa para no propagar un
// color inválido a Skia/SVG.
const HEX_VALIDO = /^#[0-9a-fA-F]{6}$/;

/**
 * Deriva el tono de un paquete desde su `master_pack_color`. Esmeralda no se
 * deriva (tiene constantes exactas): un id 'esmeralda' devuelve TONO_ESMERALDA.
 */
export function crearTonoMaster(id: string, masterPackColor: string): TonoMaster {
  if (id === ID_TONO_ESMERALDA || !HEX_VALIDO.test(masterPackColor)) return TONO_ESMERALDA;
  const original = hexAHsl(masterPackColor);
  // Mismo clamp que colorSeguroUi: colores casi negros (Abyss) o casi blancos
  // (Nevalhi) no sirven tal cual como acento de texto/botones.
  const acento = hslAHex({ h: original.h, s: original.s, l: limitar(original.l, 0.35, 0.65) });
  const deltaHue = original.h - HUE_REFERENCIA_VERDE;
  // Los PNG y los verdes base son muy saturados: un paquete casi gris necesita bajar la saturación.
  const saturacion = limitar(original.s / 0.85, 0.15, 1);
  const derivados = mapearHex(TOKENS_ESMERALDA, (hex) => rotarHex(hex, deltaHue, saturacion));
  return {
    id,
    acento,
    hue: original.h,
    deltaHue,
    saturacion,
    oscurecido: original.l < 0.3 ? 0.55 + original.l : 1,
    ...derivados,
    paleta: asegurarContrastes(derivados.paleta),
  };
}

// Una lista de hábitos repite paquetes (y cada card pide su tono en cada
// render): derivar un tono recorre unos 150 colores, así que se memoiza por
// paquete + color. Los tonos son inmutables, compartirlos es seguro.
const TONOS_POR_PAQUETE = new Map<string, TonoMaster>();

export function obtenerTonoPaquete(id: string, masterPackColor: string): TonoMaster {
  const clave = `${id}|${masterPackColor.toUpperCase()}`;
  let tono = TONOS_POR_PAQUETE.get(clave);
  if (!tono) {
    tono = crearTonoMaster(id, masterPackColor);
    TONOS_POR_PAQUETE.set(clave, tono);
  }
  return tono;
}
