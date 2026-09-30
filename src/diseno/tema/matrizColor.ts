// Matrices de color 4x5 (formato plano de Skia/Android ColorFilter) — puras, sin
// imports de Skia, para poder probarlas con vitest y componerlas en un solo
// ColorMatrix (rotar hue + saturar + oscurecer en una sola pasada).

export type MatrizColor = number[];

// Familia verde: el rango de hue donde viven los iconos que el tema debe
// seguir. Medido sobre assets/icons: 75 de 104 PNG caen entre 99° y 155°; el
// resto (gemas y niveles morados, racha naranja, agenda amarilla...) tiene un
// color con significado propio y no se toca al cambiar de tema.
export const HUE_VERDE_MIN = 70;
export const HUE_VERDE_MAX = 175;
export const esHueVerde = (hue: number) => hue >= HUE_VERDE_MIN && hue <= HUE_VERDE_MAX;

// Centro de esa familia (el verde #25884C, el más usado — mismo valor que
// HUE_REFERENCIA_VERDE_ICONO en masterColor.ts, importado de acá para que
// exista un solo número). El rango real (99°-155°, arriba) es angosto: rotar
// cada ícono por el MISMO delta respecto a su propio hue (ver deltaTema en
// MasterChanger) apenas se nota ahí, así que "cada ícono conserva su
// variedad" se veía bien. El problema aparece cuando el tema rota hacia una
// zona más "densa" perceptualmente — roja/naranja/amarilla: esos mismos 56°
// de variedad, ya rotados, caían en rojo, naranja Y amarillo a la vez bajo
// UN MISMO tema (p. ej. Golden). COHESION_TEMA achica esa variedad sin
// eliminarla: con 1 no cambia nada (comportamiento de siempre); con 0 todos
// los íconos convergerían al mismo hue exacto.
export const CENTRO_HUE_ICONOS = 142;
const COHESION_TEMA = 0.45;

/**
 * Delta efectivo a aplicar (por shader o por matriz) cuando se rota por tema
 * (ruta relativa, `deltaTema`): en vez de sumarlo tal cual al hue del ícono,
 * primero acerca ese hue al centro de la familia en la proporción
 * `1 - COHESION_TEMA`, así el resultado converge hacia el mismo hue de
 * destino en vez de desparramarse. `hueEfectivo` es el hue medido/registrado
 * del ícono (el mismo que decide si el tema lo afecta, ver `esHueVerde`).
 */
export function deltaTemaEfectivo(hueEfectivo: number, deltaTema: number): number {
  return deltaTema - (1 - COHESION_TEMA) * (hueEfectivo - CENTRO_HUE_ICONOS);
}

const LR = 0.213;
const LG = 0.715;
const LB = 0.072;

// Rotación de hue en `gradosDelta` — basada en la especificación de color
// matrices SVG/CSS, con coeficientes de luminancia de percepción humana.
export function calcularMatrizHue(gradosDelta: number): MatrizColor {
  const rad = (gradosDelta * Math.PI) / 180;
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);
  return [
    LR + cos * (1 - LR) + sin * (-LR),   LG + cos * (-LG) + sin * (-LG),   LB + cos * (-LB) + sin * (1 - LB),   0, 0,
    LR + cos * (-LR)    + sin * (0.143),  LG + cos * (1 - LG) + sin * (0.140), LB + cos * (-LB) + sin * (-0.283), 0, 0,
    LR + cos * (-LR)    + sin * (-(1 - LR)), LG + cos * (-LG) + sin * (LG),   LB + cos * (1 - LB) + sin * (LB),     0, 0,
    0, 0, 0, 1, 0,
  ];
}

// Saturación: 1 = sin cambio, 0 = escala de grises. Sirve para paquetes casi
// grises (Abyss) donde rotar solo el hue dejaría iconos indigo muy saturados.
export function matrizSaturacion(factor: number): MatrizColor {
  const inversa = 1 - factor;
  return [
    LR * inversa + factor, LG * inversa,          LB * inversa,          0, 0,
    LR * inversa,          LG * inversa + factor, LB * inversa,          0, 0,
    LR * inversa,          LG * inversa,          LB * inversa + factor, 0, 0,
    0, 0, 0, 1, 0,
  ];
}

// Escala las filas R/G/B por `factor` (1 = sin cambio, 0.9 = 10% más oscuro),
// dejando la fila de alpha intacta.
export function aplicarOscurecido(matriz: MatrizColor, factor: number): MatrizColor {
  if (factor === 1) return matriz;
  return matriz.map((valor, indice) => (indice < 15 ? valor * factor : valor));
}

// Compone dos matrices 4x5: el resultado aplica `primera` y luego `segunda`.
export function componerMatrices(primera: MatrizColor, segunda: MatrizColor): MatrizColor {
  const resultado: number[] = [];
  for (let fila = 0; fila < 4; fila++) {
    for (let columna = 0; columna < 5; columna++) {
      let suma = 0;
      for (let k = 0; k < 4; k++) suma += segunda[fila * 5 + k] * primera[k * 5 + columna];
      if (columna === 4) suma += segunda[fila * 5 + 4];
      resultado.push(suma);
    }
  }
  return resultado;
}

// Máscara de "claros": devuelve la misma matriz pero con la fila de alfa
// reemplazada para que el resultado solo sea visible donde el pixel original
// es claro (blancos, brillos, tintes muy pálidos) y transparente en los
// colores saturados. Alfa = 4·brillo − 2.4·alfa_original, recortado a 0..1 por
// el propio filtro: un verde (brillo ≈ 0.4) sale en 0, un blanco en 1, y la
// transición cae entre brillo 0.6 y 0.85. No usa el término de desplazamiento
// (no depende de en qué escala lo interprete el motor) y un pixel transparente
// (0,0,0,0) sigue siendo transparente.
export function matrizSoloClaros(matriz: MatrizColor): MatrizColor {
  const resultado = matriz.slice();
  resultado[15] = 4 / 3;
  resultado[16] = 4 / 3;
  resultado[17] = 4 / 3;
  resultado[18] = -2.4;
  resultado[19] = 0;
  return resultado;
}
