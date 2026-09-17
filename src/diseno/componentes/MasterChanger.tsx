import React, { useMemo } from 'react';
import type { ImageSourcePropType } from 'react-native';
import {
  Canvas,
  Image,
  useImage,
  ColorMatrix,
  type SkImage,
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

// Escala las filas R/G/B de una matriz de color por `factor` (1 = sin cambio,
// 0.9 = 10% más oscuro), dejando la fila de alpha intacta — se combina con la
// rotación de hue para poder pedir "verde, 10% más oscuro" en una sola pasada.
function aplicarOscurecido(matriz: number[], factor: number): number[] {
  if (factor === 1) return matriz;
  return matriz.map((valor, indice) => (indice < 15 ? valor * factor : valor));
}

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

// ─── Detección automática del hue dominante ──────────────────────────────────
// image.readPixels() sí existe de forma nativa y síncrona en
// @shopify/react-native-skia (no es solo-web, a diferencia de lo que decía
// este archivo antes). Se calcula una sola vez por imagen (memoizado por
// referencia), es una operación de milisegundos, no de cada frame.
//
// Promedio circular de hue ponderado por saturación*alpha: ignora píxeles
// transparentes, grises, casi blancos o casi negros, para que el fondo o el
// antialiasing no distorsionen el resultado hacia un hue falso.
const CACHE_HUE = new WeakMap<SkImage, number | null>();

function detectarHueDominante(imagen: SkImage): number | null {
  if (CACHE_HUE.has(imagen)) {
    return CACHE_HUE.get(imagen)!;
  }
  const ancho = imagen.width();
  const alto = imagen.height();
  if (ancho === 0 || alto === 0) return null;

  const pixeles = imagen.readPixels();
  if (!pixeles) {
    CACHE_HUE.set(imagen, null);
    return null;
  }

  const esByte = pixeles instanceof Uint8Array;
  const totalPixeles = ancho * alto;
  // Muestrea como máximo ~4096 píxeles para que la imagen más grande siga siendo instantánea.
  const paso = 4 * Math.max(1, Math.floor(totalPixeles / 4096));

  let sumaX = 0;
  let sumaY = 0;
  let pesoTotal = 0;

  for (let indice = 0; indice + 3 < pixeles.length; indice += paso) {
    const r = esByte ? pixeles[indice] / 255 : pixeles[indice];
    const g = esByte ? pixeles[indice + 1] / 255 : pixeles[indice + 1];
    const b = esByte ? pixeles[indice + 2] / 255 : pixeles[indice + 2];
    const a = esByte ? pixeles[indice + 3] / 255 : pixeles[indice + 3];
    if (a < 0.5) continue;

    const maximo = Math.max(r, g, b);
    const minimo = Math.min(r, g, b);
    const luminancia = (maximo + minimo) / 2;
    if (luminancia < 0.08 || luminancia > 0.92) continue;
    const rango = maximo - minimo;
    const saturacion = rango === 0 ? 0 : rango / (1 - Math.abs(2 * luminancia - 1));
    if (saturacion < 0.15) continue;

    let hue: number;
    if (maximo === r) hue = ((g - b) / rango) % 6;
    else if (maximo === g) hue = (b - r) / rango + 2;
    else hue = (r - g) / rango + 4;
    hue *= 60;
    if (hue < 0) hue += 360;

    const peso = saturacion * a;
    const rad = (hue * Math.PI) / 180;
    sumaX += Math.cos(rad) * peso;
    sumaY += Math.sin(rad) * peso;
    pesoTotal += peso;
  }

  if (pesoTotal === 0) {
    CACHE_HUE.set(imagen, null);
    return null;
  }
  let promedio = (Math.atan2(sumaY, sumaX) * 180) / Math.PI;
  if (promedio < 0) promedio += 360;
  CACHE_HUE.set(imagen, promedio);
  return promedio;
}

/** Hue dominante (0-360) de una SkImage ya cargada, o null si no se pudo estimar. */
export function useHueDominante(imagen: SkImage | null): number | null {
  return useMemo(() => (imagen ? detectarHueDominante(imagen) : null), [imagen]);
}

// ─── Color hex arbitrario -> el ColorMaster más parecido ─────────────────────
// MasterChanger/MasterIcon solo aceptan uno de los 7 colores fijos de arriba,
// no un hue arbitrario — esto permite tintar algo "del color del hábito" (que
// sí es un hex libre) buscando el bucket más cercano. Cálculo de hue mínimo
// y autocontenido acá (no importa colorHsl.ts de senderos/algoritmo) para que
// este componente de diseño compartido no dependa de un módulo de feature.
function hueDeHexLocal(hex: string): number {
  const limpio = hex.replace('#', '');
  const r = parseInt(limpio.slice(0, 2), 16) / 255;
  const g = parseInt(limpio.slice(2, 4), 16) / 255;
  const b = parseInt(limpio.slice(4, 6), 16) / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  if (max === min) return 0;
  const d = max - min;
  let h: number;
  if (max === r) h = (g - b) / d + (g < b ? 6 : 0);
  else if (max === g) h = (b - r) / d + 2;
  else h = (r - g) / d + 4;
  return (h / 6) * 360;
}

/** El ColorMaster (1-7) cuyo hue está más cerca del de `hex` — "un tono similar", no una réplica exacta. */
export function colorMasterMasCercano(hex: string): ColorMaster {
  const hueObjetivo = hueDeHexLocal(hex);
  let mejor: ColorMaster = 2;
  let menorDistancia = Infinity;
  (Object.keys(COLORES_MASTER) as Array<`${ColorMaster}`>).forEach((clave) => {
    const numero = Number(clave) as ColorMaster;
    const distanciaBruta = Math.abs(COLORES_MASTER[numero].hue - hueObjetivo);
    const distancia = Math.min(distanciaBruta, 360 - distanciaBruta);
    if (distancia < menorDistancia) { menorDistancia = distancia; mejor = numero; }
  });
  return mejor;
}

// ─── Props ────────────────────────────────────────────────────────────────────
interface MasterChangerProps {
  /** Fuente de la imagen (require() o uri) */
  fuente: ImageSourcePropType;
  /** Ancho del canvas en píxeles */
  ancho: number;
  /** Alto del canvas en píxeles */
  alto: number;
  /**
   * Hue de origen en grados (0-360). Si lo omites, se detecta automáticamente
   * leyendo los píxeles de la imagen — útil para assets nuevos o variados.
   * Pásalo explícito solo si ya lo mediste y quieres evitar el cálculo.
   */
  hueOrigen?: number;
  /**
   * Color destino (1=Azul, 2=Verde, 3=Amarillo, 4=Naranja, 5=Rojo, 6=Rosa, 7=Morado)
   * Si es undefined, muestra la imagen sin transformación.
   */
  colorDestino?: ColorMaster;
  /** Cómo encaja la imagen en el canvas. Por defecto "contain" (no recorta íconos). */
  fit?: 'contain' | 'cover' | 'fill' | 'fitHeight' | 'fitWidth' | 'none' | 'scaleDown';
  /**
   * Factor de oscurecido tras rotar el hue: 1 = sin cambio, 0.9 = 10% más
   * oscuro, 0.7 = 30% más oscuro. Se combina con `colorDestino` en una sola
   * matriz — no son dos pasadas.
   */
  oscurecido?: number;
}

// ─── Componente Principal ─────────────────────────────────────────────────────
export function MasterChanger({
  fuente,
  ancho,
  alto,
  hueOrigen,
  colorDestino,
  fit = 'contain',
  oscurecido = 1,
}: MasterChangerProps) {
  // Skia tipa useImage de forma más estricta (DataSourceParam) de lo que
  // realmente acepta en tiempo de ejecución (require() numérico o uri) — cast
  // deliberado, no un error real.
  const imagen = useImage(fuente as never);
  const hueDetectado = useHueDominante(hueOrigen === undefined ? imagen : null);
  const hueEfectivo = hueOrigen ?? hueDetectado;

  const colorMatrix = useMemo(() => {
    if (colorDestino === undefined && oscurecido === 1) return null;
    const delta = colorDestino !== undefined && hueEfectivo !== null ? calcularDeltaHue(hueEfectivo, COLORES_MASTER[colorDestino].hue) : 0;
    return aplicarOscurecido(calcularMatrizHue(delta), oscurecido);
  }, [hueEfectivo, colorDestino, oscurecido]);

  if (!imagen) return null;

  return (
    <Canvas opaque={false} style={{ width: ancho, height: alto }}>
      <Image
        image={imagen}
        x={0}
        y={0}
        width={ancho}
        height={alto}
        fit={fit}
      >
        {colorMatrix && (
          <ColorMatrix matrix={colorMatrix} />
        )}
      </Image>
    </Canvas>
  );
}
