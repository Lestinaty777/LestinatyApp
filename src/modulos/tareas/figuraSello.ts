import type { TrazoFigura } from './tareas.tipos';

// El sello del sendero de días de Tareas NO es una mandala (simetría radial,
// pétalos curvos repetidos) — es una sola figura con simetría de espejo
// horizontal, de aristas rectas:
//
//   ancla_izq ───────────────── ancla_der   (línea guía fija, siempre visible)
//       \                           /
//        \___ trazo del usuario ___/         (solo en la mitad de ABAJO)
//
// El usuario dibuja un único trazo en la mitad inferior del lienzo, desde el
// ancla izquierda hacia la derecha; la mitad superior es el espejo exacto de
// ese trazo. Como ambas mitades comparten las mismas dos anclas, el contorno
// cierra solo, sin poder autointersectarse — no hace falta "unir puntas" ni
// detectar cruces. Sin suavizado de curvas (a diferencia de la mandala de
// Hábitos): los puntos se unen con rectas, para que se lea como un cristal
// facetado, no como un pétalo.
export const RADIO_FIGURA_SELLO = 150;

export function anclaIzquierdaSello(radio: number = RADIO_FIGURA_SELLO): TrazoFigura {
  return { x: -radio, y: 0 };
}

export function anclaDerechaSello(radio: number = RADIO_FIGURA_SELLO): TrazoFigura {
  return { x: radio, y: 0 };
}

/** Ancla cualquier punto que se salga de la mitad de abajo (y >= 0) de vuelta a la línea central. */
export function restringirAMitadInferior(punto: TrazoFigura): TrazoFigura {
  return punto.y < 0 ? { x: punto.x, y: 0 } : punto;
}

/**
 * Distancia (0 a 1, 1 = encima) del punto a la línea guía entre las dos
 * anclas — equivalente a `cercaniaRayo` de la mandala (ahí mide cercanía a
 * uno de los N rayos radiales; acá solo hay una línea recta que guiar).
 */
export function cercaniaLineaGuiaSello(punto: TrazoFigura, radio: number = RADIO_FIGURA_SELLO): number {
  const distanciaVertical = Math.abs(punto.y);
  const fueraDeRango = Math.abs(punto.x) > radio;
  if (fueraDeRango) return 0;
  return Math.max(0, 1 - distanciaVertical / (radio * 0.35));
}

/**
 * Construye el contorno cerrado completo: ancla izquierda -> trazo del
 * usuario (mitad de abajo, en orden) -> ancla derecha -> el mismo trazo
 * espejado verticalmente, de vuelta hacia la izquierda. Sin pasar por
 * `contornoCinta` ni por ninguna rotación: esto YA es el área cerrada final,
 * lista para extruir tal cual (ver SelloExtruido.tsx).
 */
export function construirContornoEspejo(trazoInferior: TrazoFigura[], radio: number = RADIO_FIGURA_SELLO): TrazoFigura[] {
  const izquierda = anclaIzquierdaSello(radio);
  const derecha = anclaDerechaSello(radio);
  const abajo = [izquierda, ...trazoInferior.map(restringirAMitadInferior), derecha];
  const arribaDeVuelta = trazoInferior
    .map(restringirAMitadInferior)
    .reverse()
    .map((punto) => ({ x: punto.x, y: -punto.y }));
  return [...abajo, ...arribaDeVuelta];
}
