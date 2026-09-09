import React, { useMemo } from 'react';
import { ImageSourcePropType } from 'react-native';
import {
  Canvas,
  Image,
  useImage,
  ColorMatrix,
  Paint,
} from '@shopify/react-native-skia';

// ─── Colores Destino (Hue en grados) ─────────────────────────────────────────
export const COLORES_MASTER = {
  1: { nombre: 'Azul',     hue: 220 },
  2: { nombre: 'Verde',    hue: 130 },
  3: { nombre: 'Amarillo', hue: 55  },
  4: { nombre: 'Naranja',  hue: 30  },
  5: { nombre: 'Rojo',     hue: 0   },
  6: { nombre: 'Rosa',     hue: 330 },
  7: { nombre: 'Morado',   hue: 275 },
} as const;

export type ColorMaster = keyof typeof COLORES_MASTER;

// ─── Algoritmo: Matriz de rotación de Hue (HSL → RGB) ────────────────────────
// Basado en la especificación de color matrices SVG/CSS
function calcularMatrizHue(gradosDelta: number): number[] {
  const rad = (gradosDelta * Math.PI) / 180;
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);

  // Coeficientes de luminancia (percepción humana)
  const lr = 0.213;
  const lg = 0.715;
  const lb = 0.072;

  // Matriz 4x5 (formato flat de Skia/Android ColorFilter)
  return [
    lr + cos * (1 - lr) + sin * (-lr),   lg + cos * (-lg) + sin * (-lg),   lb + cos * (-lb) + sin * (1 - lb),   0, 0,
    lr + cos * (-lr)    + sin * (0.143),  lg + cos * (1-lg) + sin * (0.140), lb + cos * (-lb) + sin * (-0.283), 0, 0,
    lr + cos * (-lr)    + sin * (-(1-lr)), lg + cos * (-lg) + sin * (lg),   lb + cos * (1-lb) + sin * (lb),     0, 0,
    0, 0, 0, 1, 0,
  ];
}

// ─── Utilidad: detectar hue dominante de una imagen (canvas 2D) ──────────────
// Dado que Skia no expone acceso directo a píxeles en RN de forma síncrona,
// usamos una muestra estimada basada en el color "tema" del asset.
// Para producción real, ver: makeImageSnapshot + toTypedArray (solo disponible
// en la web y en algunos builds de Skia). En mobile lo manejamos con ColorMatrix
// puro ya que lo que importa es el DELTA del hue, no el hue absoluto.

/**
 * Calcula cuántos grados hay que rotar para ir del hueOrigen al hueDestino.
 * Siempre toma el camino más corto.
 */
export function calcularDeltaHue(hueOrigen: number, hueDestino: number): number {
  let delta = hueDestino - hueOrigen;
  // Normalizar al rango (-180, 180] para tomar el camino más corto
  while (delta > 180) delta -= 360;
  while (delta <= -180) delta += 360;
  return delta;
}

// ─── Props ────────────────────────────────────────────────────────────────────
interface MasterChangerProps {
  /** Fuente de la imagen (require() o uri) */
  fuente: string;
  /** Ancho del canvas en píxeles */
  ancho: number;
  /** Alto del canvas en píxeles */
  alto: number;
  /**
   * El hue estimado/dominante de tu imagen en grados (0-360).
   * Mídelo una vez con una herramienta de color picker y pásalo como constante.
   * Ejemplo: una imagen azul → hueOrigen = 220
   */
  hueOrigen: number;
  /**
   * Color destino (1=Azul, 2=Verde, 3=Amarillo, 4=Naranja, 5=Rojo, 6=Rosa, 7=Morado)
   * Si es undefined, muestra la imagen sin transformación.
   */
  colorDestino?: ColorMaster;
}

// ─── Componente Principal ─────────────────────────────────────────────────────
export function MasterChanger({
  fuente,
  ancho,
  alto,
  hueOrigen,
  colorDestino,
}: MasterChangerProps) {
  const imagen = useImage(fuente);

  const colorMatrix = useMemo(() => {
    if (colorDestino === undefined) return null;
    const hueDestino = COLORES_MASTER[colorDestino].hue;
    const delta = calcularDeltaHue(hueOrigen, hueDestino);
    return calcularMatrizHue(delta);
  }, [hueOrigen, colorDestino]);

  if (!imagen) return null;

  return (
    <Canvas style={{ width: ancho, height: alto }}>
      <Image
        image={imagen}
        x={0}
        y={0}
        width={ancho}
        height={alto}
        fit="cover"
      >
        {colorMatrix && (
          <ColorMatrix matrix={colorMatrix} />
        )}
      </Image>
    </Canvas>
  );
}
