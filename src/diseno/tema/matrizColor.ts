// Matrices de color 4x5 (formato plano de Skia/Android ColorFilter) — puras, sin
// imports de Skia, para poder probarlas con vitest y componerlas en un solo
// ColorMatrix (rotar hue + saturar + oscurecer en una sola pasada).

export type MatrizColor = number[];

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
