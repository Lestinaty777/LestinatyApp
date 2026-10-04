import { describe, expect, it } from 'vitest';

import {
  anclaDerechaSello,
  anclaIzquierdaSello,
  cercaniaLineaGuiaSello,
  construirContornoEspejo,
  restringirAMitadInferior,
} from './figuraSello';

describe('restringirAMitadInferior', () => {
  it('deja intactos los puntos ya en la mitad de abajo', () => {
    expect(restringirAMitadInferior({ x: 12, y: 40 })).toEqual({ x: 12, y: 40 });
  });

  it('ancla a la línea central (y=0) cualquier punto que se cruce hacia arriba', () => {
    expect(restringirAMitadInferior({ x: 12, y: -40 })).toEqual({ x: 12, y: 0 });
  });

  it('un punto exactamente sobre la línea central no cambia', () => {
    expect(restringirAMitadInferior({ x: 5, y: 0 })).toEqual({ x: 5, y: 0 });
  });
});

describe('construirContornoEspejo', () => {
  it('arranca en el ancla izquierda y pasa por la derecha a la mitad del contorno', () => {
    const trazo = [{ x: -60, y: 30 }, { x: 0, y: 80 }, { x: 60, y: 30 }];
    const contorno = construirContornoEspejo(trazo, 150);
    expect(contorno[0]).toEqual(anclaIzquierdaSello(150));
    expect(contorno[4]).toEqual(anclaDerechaSello(150));
    expect(contorno).toHaveLength(8); // 2 anclas + 3 puntos abajo + 3 puntos espejados arriba
  });

  it('la mitad de arriba es el espejo vertical exacto de la mitad de abajo', () => {
    const trazo = [{ x: -40, y: 20 }, { x: 10, y: 55 }, { x: 45, y: 15 }];
    const contorno = construirContornoEspejo(trazo, 150);
    // Puntos 1..3 son el trazo de abajo tal cual; 5..7 son su espejo, en orden inverso.
    const abajo = contorno.slice(1, 4);
    const arriba = contorno.slice(5, 8);
    expect(arriba).toEqual([...abajo].reverse().map((p) => ({ x: p.x, y: -p.y })));
  });

  it('cada punto de arriba tiene su contraparte exacta abajo (simetría total)', () => {
    const trazo = [{ x: -70, y: 10 }, { x: -10, y: 90 }, { x: 50, y: 40 }];
    const contorno = construirContornoEspejo(trazo, 150);
    for (const punto of contorno) {
      const espejo = contorno.find((p) => p.x === punto.x && p.y === -punto.y);
      expect(espejo).toBeDefined();
    }
  });

  it('el trazo de entrada que se sale hacia arriba queda anclado a y=0 en la mitad de abajo del contorno', () => {
    const trazoConCruce = [{ x: -30, y: 20 }, { x: 0, y: -15 }, { x: 30, y: 25 }];
    const contorno = construirContornoEspejo(trazoConCruce, 150);
    // Puntos 1..3 son la mitad de abajo (ancla izq. + trazo + ancla der. están en 0 y 4):
    // ninguno puede tener y<0 — el punto {0,-15} debe haber quedado en y=0.
    const mitadDeAbajo = contorno.slice(0, 5);
    expect(mitadDeAbajo.every((p) => p.y >= 0)).toBe(true);
    expect(mitadDeAbajo[2]).toEqual({ x: 0, y: 0 });
  });

  it('con un trazo vacío, el contorno es solo las dos anclas (degenerado, área cero)', () => {
    const contorno = construirContornoEspejo([], 150);
    expect(contorno).toEqual([anclaIzquierdaSello(150), anclaDerechaSello(150)]);
  });
});

describe('cercaniaLineaGuiaSello', () => {
  it('es máxima (1) justo sobre la línea guía', () => {
    expect(cercaniaLineaGuiaSello({ x: 0, y: 0 }, 150)).toBe(1);
  });

  it('baja a medida que el punto se aleja verticalmente de la línea', () => {
    const cercaDeLaLinea = cercaniaLineaGuiaSello({ x: 0, y: 10 }, 150);
    const lejosDeLaLinea = cercaniaLineaGuiaSello({ x: 0, y: 40 }, 150);
    expect(cercaDeLaLinea).toBeGreaterThan(lejosDeLaLinea);
  });

  it('es 0 fuera del rango horizontal de las anclas', () => {
    expect(cercaniaLineaGuiaSello({ x: 200, y: 0 }, 150)).toBe(0);
  });
});
