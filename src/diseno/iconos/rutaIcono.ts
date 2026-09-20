import { esHueVerde } from '../tema/matrizColor';

export type RutaIcono = 'imagen' | 'skia';

type Entrada = {
  /** Hue dominante medido del PNG. `undefined` = no se conoce (hay que decodificarlo para saberlo). */
  hue?: number;
  /** Teñido forzado de la API vieja (1-7) o a un hue exacto: siempre necesita rotar. */
  color?: number;
  hueDestino?: number;
  oscurecido?: number;
  /** Rotación relativa del tema activo. `undefined` = Esmeralda (nada que rotar). */
  deltaHue?: number;
};

/**
 * Decide cómo se dibuja un ícono:
 * - 'imagen': un <Image> normal de React Native — síncrono, sin Skia. Es el
 *   camino de casi todos: Esmeralda no rota nada, y los íconos que no son
 *   verdes (gemas, racha, insignias...) no los toca el tema.
 * - 'skia': un Canvas con ColorMatrix, solo cuando de verdad hay que rotar el
 *   matiz, saturar u oscurecer.
 */
export function rutaDeIcono({ color, deltaHue, hue, hueDestino, oscurecido = 1 }: Entrada): RutaIcono {
  if (color !== undefined || hueDestino !== undefined || oscurecido !== 1) return 'skia';
  if (deltaHue === undefined) return 'imagen';
  // Con tema activo: si no sabemos el hue hay que decodificar el PNG para averiguarlo.
  return hue === undefined || esHueVerde(hue) ? 'skia' : 'imagen';
}
