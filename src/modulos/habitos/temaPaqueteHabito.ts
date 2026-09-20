import type { ColorMaster } from '../../diseno/iconos/MasterIcon';

const HUES_MASTER: Record<ColorMaster, number> = { 1: 220, 2: 130, 3: 55, 4: 30, 5: 0, 6: 330, 7: 275 };

function hueDeHex(hex: string): number {
  const valor = hex.replace('#', '');
  const r = parseInt(valor.slice(0, 2), 16) / 255, g = parseInt(valor.slice(2, 4), 16) / 255, b = parseInt(valor.slice(4, 6), 16) / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b), delta = max - min;
  if (delta === 0) return 0;
  const sector = max === r ? (g - b) / delta + (g < b ? 6 : 0) : max === g ? (b - r) / delta + 2 : (r - g) / delta + 4;
  return sector * 60;
}

export function obtenerColorMasterPaquete(colorPaquete: string): ColorMaster {
  const hue = hueDeHex(colorPaquete);
  return ([1, 2, 3, 4, 5, 6, 7] as ColorMaster[]).reduce((mejor, candidato) => {
    const distancia = Math.abs(((HUES_MASTER[candidato] - hue + 540) % 360) - 180);
    const distanciaMejor = Math.abs(((HUES_MASTER[mejor] - hue + 540) % 360) - 180);
    return distancia < distanciaMejor ? candidato : mejor;
  }, 2 as ColorMaster);
}
