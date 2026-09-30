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
  /**
   * Hue absoluto del paquete en grados OKLCH: para rotar la paleta (`tintarHex`/`rotarHex`).
   * `undefined` en Esmeralda.
   */
  hue?: number;
  /** Rotación de la PALETA respecto a Esmeralda, en grados OKLCH (hue del paquete − HUE_REFERENCIA_VERDE). `undefined` en Esmeralda = sin rotar. */
  deltaHue?: number;
  /**
   * Hue absoluto del paquete en grados HSL: para teñidos forzados de ÍCONOS
   * (`MasterIcon hueDestino`, `MasterIconBg`) — el tinte por píxel de
   * MasterChanger/matrizColor.ts rota en HSL/RGB, no en OKLCH, así que no
   * puede recibir `hue` (que sí es OKLCH, para no reintroducir el café de la
   * franja amarilla en la paleta). `undefined` en Esmeralda.
   */
  hueIcono?: number;
  /** Rotación de ÍCONOS respecto a Esmeralda, en grados HSL — ver `hueIcono`. `undefined` en Esmeralda = sin rotar. */
  deltaHueIcono?: number;
  /** Factor de saturación HSL de la paleta y de `tintarHex`. 1 = sin cambio; baja en paquetes de color poco saturado. */
  saturacion: number;
  /**
   * Cómo se ajustan los iconos PNG (en HSV, por píxel) para que el icono típico caiga en el color del paquete:
   * Eclipse (#6A3FA0) pide saturación 0.9× y valor 0.82× — un morado profundo, no pastel. Ver ICONO_REFERENCIA_HSV.
   */
  icono: { saturacion: number; valor: number };
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

/**
 * Color "típico" de un icono verde de assets/icons, medido sobre los 75 PNG verdes (media de la saturación y el
 * valor HSV del color principal: 0.67 y 0.77). Los factores de `icono` son relativos a él: el icono típico
 * termina exactamente en el color del paquete, y cada icono conserva su diferencia respecto al típico.
 */
export const ICONO_REFERENCIA_HSV = { s: 0.67, v: 0.77 };

// Matiz (en Oklch, no HSL) del verde que más se usa (#25884C) y donde se
// concentran los iconos PNG (mediana 135° en HSL, la mayoría entre 140° y
// 149°) — es el "cero" de la rotación de la paleta. El motor de la paleta
// pasó de HSL a Oklch (ver la sección Oklch más arriba); este valor es el
// matiz Oklch de ese mismo verde (antes 142, el matiz HSL), no un
// redondeo del mismo número.
export const HUE_REFERENCIA_VERDE = 152.26;
// El mismo "cero", pero en HSL (142°): lo sigue usando el teñido de íconos
// (MasterChanger/matrizColor.ts, ver `hueIcono`/`deltaHueIcono` en
// TonoMaster) — esa rotación es HSL/RGB por píxel y nunca se migró a Oklch.
// Antes de esta separación, `deltaHue` servía a la vez para paleta e íconos:
// al pasar la paleta a Oklch, un delta calculado en grados Oklch se estaba
// aplicando a una rotación que interpreta grados en HSL (espacios de matiz
// distintos), y un ícono "amarillo" terminaba rotando de más hacia el verde.
export const HUE_REFERENCIA_VERDE_ICONO = 142;
// Croma Oklch de referencia: promedio de 'vivo' (#21A844) y 'brillante'
// (#22C55E), los verdes más saturados de la paleta — equivalente al 0.68 de
// saturación HSL que usaba la versión anterior.
const CROMA_REFERENCIA_VERDE = 0.1855;

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
  icono: { saturacion: 1, valor: 1 },
  ...TOKENS_ESMERALDA,
};

type Hsl = { h: number; s: number; l: number };
type Oklch = { c: number; h: number; l: number };

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

/** HSV de un color HSL (h en grados). */
function hslAHsv({ s, l }: Hsl) {
  const v = l + s * Math.min(l, 1 - l);
  return { s: v === 0 ? 0 : 2 * (1 - l / v), v };
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

// ─── Oklch ──────────────────────────────────────────────────────────────────
// Motor de color de la paleta (fondos, texto, paneles): antes HSL, ahora
// Oklch. El problema que resuelve: HSL conserva la "claridad" numérica al
// rotar un matiz, pero esa claridad NO se percibe igual en todos los
// matices — un verde oscuro rotado a naranja/amarillo da un naranja de la
// MISMA claridad numérica, que el ojo lee como café (café es, literalmente,
// naranja oscuro poco saturado). Oklch mide claridad (L) de forma uniforme
// para el ojo humano en cualquier matiz, así que un tono "igual de oscuro"
// en L se ve igual de oscuro sin importar si es azul, rojo, verde o
// amarillo — ya no hace falta ningún caso especial para los paquetes
// amarillos (Golden, Aurelia). Fórmulas públicas de Björn Ottosson
// (https://bottosson.github.io/posts/oklab/); sin librería nueva.
//
// Exportadas a propósito: cuando se mejore el tinte de íconos (tinteHsv.ts,
// sistema aparte, por píxel) o cuando se diseñe el modo oscuro, ambos pueden
// reusar esta misma conversión en vez de inventar la suya.

function srgbALineal(canal: number): number {
  const c = canal / 255;
  return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
}

function linealASrgb(canal: number): number {
  const c = limitar(canal, 0, 1);
  const v = c <= 0.0031308 ? c * 12.92 : 1.055 * c ** (1 / 2.4) - 0.055;
  return Math.round(limitar(v, 0, 1) * 255);
}

const raizCubica = (v: number) => (v >= 0 ? Math.cbrt(v) : -Math.cbrt(-v));

/** RGB lineal (0-1) → Oklab, vía el espacio LMS intermedio de Ottosson. */
function linealAOklab(r: number, g: number, b: number) {
  const l = 0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b;
  const m = 0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b;
  const s = 0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b;
  const l_ = raizCubica(l), m_ = raizCubica(m), s_ = raizCubica(s);
  return {
    L: 0.2104542553 * l_ + 0.7936177850 * m_ - 0.0040720468 * s_,
    a: 1.9779984951 * l_ - 2.4285922050 * m_ + 0.4505937099 * s_,
    b: 0.0259040371 * l_ + 0.7827717662 * m_ - 0.8086757660 * s_,
  };
}

/** Oklab → RGB lineal (0-1, puede salirse del rango: ver `oklchAHex` para el recorte de gamut). */
function oklabALineal(L: number, a: number, b: number) {
  const l_ = L + 0.3963377774 * a + 0.2158037573 * b;
  const m_ = L - 0.1055613458 * a - 0.0638541728 * b;
  const s_ = L - 0.0894841775 * a - 1.2914855480 * b;
  const l = l_ ** 3, m = m_ ** 3, s = s_ ** 3;
  return {
    r: +4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    g: -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    b: -0.0041960863 * l - 0.7034186147 * m + 1.7076147010 * s,
  };
}

function hexAOklch(hex: string): Oklch {
  const { r, g, b } = hexARgb(hex);
  const { L, a, b: bLab } = linealAOklab(srgbALineal(r), srgbALineal(g), srgbALineal(b));
  const c = Math.hypot(a, bLab);
  const h = c < 1e-6 ? 0 : (((Math.atan2(bLab, a) * 180) / Math.PI) % 360 + 360) % 360;
  return { c, h, l: L };
}

function oklchARgbLineal(oklch: Oklch) {
  const rad = (oklch.h * Math.PI) / 180;
  return oklabALineal(oklch.l, oklch.c * Math.cos(rad), oklch.c * Math.sin(rad));
}

function dentroDeGamut({ r, g, b }: { r: number; g: number; b: number }) {
  const margen = 1e-4;
  return r >= -margen && r <= 1 + margen && g >= -margen && g <= 1 + margen && b >= -margen && b <= 1 + margen;
}

/**
 * Oklch → hex, recortando el croma si el color no existe en sRGB (pasa con
 * croma alto en ciertos matices) — se reduce el croma manteniendo matiz y
 * claridad hasta entrar en gamut, en vez de recortar cada canal RGB por
 * separado (eso desvía el matiz, aquí no).
 */
function oklchAHex(oklch: Oklch): string {
  let actual = oklchARgbLineal(oklch);
  if (!dentroDeGamut(actual)) {
    let bajo = 0, alto = oklch.c;
    for (let i = 0; i < 20; i++) {
      const medio = (bajo + alto) / 2;
      const candidato = oklchARgbLineal({ ...oklch, c: medio });
      if (dentroDeGamut(candidato)) bajo = medio; else alto = medio;
    }
    actual = oklchARgbLineal({ ...oklch, c: bajo });
  }
  const canal = (v: number) => linealASrgb(v).toString(16).padStart(2, '0');
  return `#${canal(actual.r)}${canal(actual.g)}${canal(actual.b)}`.toUpperCase();
}

// Un amarillo/naranja OSCURO se percibe café sin importar el modelo de
// color — Oklch mide la claridad de forma pareja entre matices, pero no
// cambia el hecho de que "amarillo oscuro" ES, perceptualmente, café. Se
// verificó con números reales (ver la sesión): incluso rotando en Oklch
// puro, un verde oscuro (usado para títulos) rotado a Golden seguía dando
// #654805. La corrección es un piso de claridad Y de croma que solo actúa
// cerca de la franja amarilla/naranja — en azules, rojos y verdes (donde no
// hay problema) el peso cae a 0 y el resultado es idéntico a rotar sin piso.
const CENTRO_FRANJA_AMARILLA = 85; // entre el matiz Oklch de Golden (78°) y Aurelia (92°)
const ANCHO_FRANJA_AMARILLA = 70; // se apaga por completo fuera de ~[15°, 155°]
const PISO_CLARIDAD_AMARILLA = 0.58;
const PISO_CROMA_AMARILLA = 0.15;

function pesoFranjaAmarilla(hue: number): number {
  const distancia = Math.abs((((hue - CENTRO_FRANJA_AMARILLA + 180) % 360) + 360) % 360 - 180);
  return Math.max(0, 1 - distancia / ANCHO_FRANJA_AMARILLA);
}

/** Rota el matiz de `hex` `delta` grados en Oklch y escala su croma; la claridad no cambia salvo en la franja amarilla (ver arriba). */
function rotarHex(hex: string, delta: number, escalaCroma: number): string {
  const { c, h, l } = hexAOklch(hex);
  const hueRotado = (((h + delta) % 360) + 360) % 360;
  const peso = pesoFranjaAmarilla(hueRotado);
  const claridad = Math.max(l, PISO_CLARIDAD_AMARILLA * peso);
  const croma = Math.max(c * escalaCroma, PISO_CROMA_AMARILLA * peso);
  return oklchAHex({ c: croma, h: hueRotado, l: claridad });
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
  const original = hexAOklch(masterPackColor);
  // Mismo criterio que antes (colorSeguroUi): colores casi negros (Abyss) o
  // casi blancos (Nevalhi) no sirven tal cual como acento de texto/botones.
  // Los límites (en L de Oklch, no en claridad HSL) se eligieron para que el
  // resultado siga cumpliendo el mismo contraste mínimo que antes — ver
  // masterColor.test.ts.
  const acento = oklchAHex({ c: original.c, h: original.h, l: limitar(original.l, 0.46, 0.70) });
  const deltaHue = original.h - HUE_REFERENCIA_VERDE;
  // Los verdes base de la paleta rondan 0.1855 de croma Oklch (vivo #21A844, brillante #22C55E): un paquete
  // menos saturado que eso (Eclipse, Abyss) baja la de toda la paleta, en la misma proporción.
  const saturacion = limitar(original.c / CROMA_REFERENCIA_VERDE, 0.15, 1);
  // Los iconos se ajustan en HSV contra el color REAL del paquete, no contra
  // `acento` — ese clamp existe para que el texto/los botones sean legibles,
  // no para limitar qué tan claro/oscuro se ve un ícono. Con HSL casi no se
  // notaba (a Nevalhi el clamp de acento apenas lo tocaba), pero con Oklch
  // el clamp de acento y el brillo HSV de un paquete muy pálido divergen
  // bastante más — usar el color real evita apagar íconos de paquetes claros.
  const originalHsl = hexAHsl(masterPackColor);
  const objetivo = hslAHsv(originalHsl);
  const icono = { saturacion: limitar(objetivo.s / ICONO_REFERENCIA_HSV.s, 0.15, 1.3), valor: limitar(objetivo.v / ICONO_REFERENCIA_HSV.v, 0.3, 1.35) };
  const derivados = mapearHex(TOKENS_ESMERALDA, (hex) => rotarHex(hex, deltaHue, saturacion));
  return {
    id,
    acento,
    hue: original.h,
    deltaHue,
    // En HSL, no Oklch — ver `hueIcono`/`deltaHueIcono` en TonoMaster.
    hueIcono: originalHsl.h,
    deltaHueIcono: originalHsl.h - HUE_REFERENCIA_VERDE_ICONO,
    saturacion,
    icono,
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
