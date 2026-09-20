import { ESCALA_ESMERALDA, type EscalaMaster } from '../tema/escalaEsmeralda';

// Tokens de marca: los verdes de la app. Siguen el tono activo (ver useColores);
// los semánticos (éxito, error, acento) NO se tiñen con el tema.
export const coloresDeMarca = (esc: EscalaMaster) => ({
  primario: esc.lima.l70,
  primarioOscuro: esc.lima.l40,
  primarioTexto: esc.lima.l46,
  primarioSuave: esc.hoja.l98,
});

export const colores = {
  fondo: '#FAFAF8',
  fondoCalido: '#F1DACB',
  superficie: '#FFFFFF',
  tinta: '#16171B',
  tintaSuave: '#6E7079',
  tintaTenue: '#A6A8AE',
  ...coloresDeMarca(ESCALA_ESMERALDA),
  acento: '#2451B3',
  acentoOscuro: '#1E3E80',
  acentoSuave: '#EDF1FB',
  texto: '#16171B',
  textoSecundario: '#6E7079',
  borde: '#E7E7E2',
  error: '#B23B2E',
  errorOscuro: '#7C2A20',
  errorSuave: '#FBECEA',
  exito: ESCALA_ESMERALDA.jade.l53,
  exitoSuave: ESCALA_ESMERALDA.hoja.l98,
  lipSecundario: '#D2D2CB',
};

export type PaletaBioma = {
  master: string;
  primary: string;
  primarySoft: string;
  primaryMuted: string;
  primaryDark: string;
  accent: string;
  accentSoft: string;
};

function normalizarHex(hex: string) {
  const limpio = hex.replace('#', '').trim();

  if (limpio.length === 3) {
    return limpio
      .split('')
      .map((canal) => canal + canal)
      .join('');
  }

  return limpio.padEnd(6, '0').slice(0, 6);
}

function hexARgb(hex: string) {
  const normalizado = normalizarHex(hex);

  return {
    r: parseInt(normalizado.slice(0, 2), 16),
    g: parseInt(normalizado.slice(2, 4), 16),
    b: parseInt(normalizado.slice(4, 6), 16),
  };
}

function canalAHex(canal: number) {
  return Math.round(Math.min(255, Math.max(0, canal)))
    .toString(16)
    .padStart(2, '0')
    .toUpperCase();
}

function rgbAHex({ r, g, b }: { r: number; g: number; b: number }) {
  return `#${canalAHex(r)}${canalAHex(g)}${canalAHex(b)}`;
}

function mezclar(hex: string, destino: string, cantidad: number) {
  const origenRgb = hexARgb(hex);
  const destinoRgb = hexARgb(destino);

  return rgbAHex({
    r: origenRgb.r + (destinoRgb.r - origenRgb.r) * cantidad,
    g: origenRgb.g + (destinoRgb.g - origenRgb.g) * cantidad,
    b: origenRgb.b + (destinoRgb.b - origenRgb.b) * cantidad,
  });
}

export function crearPaletaBioma(masterColor: string): PaletaBioma {
  return {
    master: masterColor,
    primary: masterColor,
    primarySoft: mezclar(masterColor, '#FFFFFF', 0.82),
    primaryMuted: mezclar(masterColor, '#FFFFFF', 0.48),
    primaryDark: mezclar(masterColor, '#000000', 0.42),
    accent: mezclar(masterColor, '#FFFFFF', 0.28),
    accentSoft: mezclar(masterColor, '#FFFFFF', 0.9),
  };
}
