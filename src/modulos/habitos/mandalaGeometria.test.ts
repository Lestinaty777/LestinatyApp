import { describe, expect, it } from 'vitest';

import { construirCaminosMandala, resamplearTrazo, rotarPuntos, suavizarTrazo, trazoDesdeSemilla } from './mandalaGeometria';

describe('resamplearTrazo', () => {
  it('devuelve exactamente n puntos, evenmente espaciados por longitud de arco', () => {
    const puntos = [{ x: 0, y: 0 }, { x: 100, y: 0 }];
    const resultado = resamplearTrazo(puntos, 9);
    expect(resultado).toHaveLength(9);
    expect(resultado[0]).toEqual({ x: 0, y: 0 });
    expect(resultado[8].x).toBeCloseTo(100, 5);
    expect(resultado[4].x).toBeCloseTo(50, 5);
  });

  it('con menos de 2 puntos, devuelve el trazo tal cual', () => {
    const puntos = [{ x: 3, y: 4 }];
    expect(resamplearTrazo(puntos, 9)).toEqual(puntos);
  });
});

describe('trazoDesdeSemilla', () => {
  it('es determinista: misma semilla, mismos puntos', () => {
    const a = trazoDesdeSemilla('abc123');
    const b = trazoDesdeSemilla('abc123');
    expect(a).toEqual(b);
  });

  it('semillas distintas producen trazos distintos', () => {
    const a = trazoDesdeSemilla('abc123');
    const b = trazoDesdeSemilla('xyz789');
    expect(a).not.toEqual(b);
  });

  it('nunca produce puntos fuera de un radio razonable', () => {
    const puntos = trazoDesdeSemilla('semilla-cualquiera', 100);
    for (const p of puntos) {
      expect(Math.hypot(p.x, p.y)).toBeLessThan(140);
    }
  });
});

describe('suavizarTrazo', () => {
  it('pasa exactamente por el primer y último punto original', () => {
    const puntos = [{ x: 0, y: 0 }, { x: 10, y: 0 }, { x: 10, y: 10 }, { x: 0, y: 10 }];
    const suave = suavizarTrazo(puntos);
    expect(suave[0]).toEqual(puntos[0]);
    expect(suave[suave.length - 1]).toEqual(puntos[puntos.length - 1]);
  });

  it('produce más puntos que el original (interpola, no simplifica)', () => {
    const puntos = [{ x: 0, y: 0 }, { x: 10, y: 0 }, { x: 10, y: 10 }, { x: 0, y: 10 }];
    expect(suavizarTrazo(puntos).length).toBeGreaterThan(puntos.length);
  });

  it('con menos de 3 puntos, devuelve el trazo tal cual (nada que suavizar)', () => {
    const puntos = [{ x: 0, y: 0 }, { x: 5, y: 5 }];
    expect(suavizarTrazo(puntos)).toEqual(puntos);
  });
});

describe('rotarPuntos', () => {
  it('rotar 360° devuelve (aprox.) los mismos puntos', () => {
    const puntos = [{ x: 10, y: 0 }, { x: 0, y: 10 }];
    const rotado = rotarPuntos(puntos, Math.PI * 2);
    rotado.forEach((p, i) => {
      expect(p.x).toBeCloseTo(puntos[i].x, 5);
      expect(p.y).toBeCloseTo(puntos[i].y, 5);
    });
  });

  it('rotar 90° manda (1,0) a (0,1)', () => {
    const [rotado] = rotarPuntos([{ x: 1, y: 0 }], Math.PI / 2);
    expect(rotado.x).toBeCloseTo(0, 5);
    expect(rotado.y).toBeCloseTo(1, 5);
  });
});

describe('construirCaminosMandala', () => {
  it('siempre produce 7 caminos (simetría radial de 7)', () => {
    const puntos = trazoDesdeSemilla('cualquiera');
    expect(construirCaminosMandala(puntos, 12)).toHaveLength(7);
  });

  it('cada camino es un path SVG cerrado no vacío', () => {
    const puntos = trazoDesdeSemilla('cualquiera');
    const caminos = construirCaminosMandala(puntos, 12);
    for (const d of caminos) {
      expect(d.startsWith('M ')).toBe(true);
      expect(d.endsWith('Z')).toBe(true);
    }
  });

  it('con un trazo degenerado (un solo punto) no arroja, devuelve caminos vacíos', () => {
    expect(construirCaminosMandala([{ x: 0, y: 0 }], 12)).toEqual(Array(7).fill(''));
  });

  // Fase 8 (sendero de días de tareas): `pliegues` es opcional y por default
  // sigue dando la simetría de 7 de Hábitos — el sello de Tareas pasa otro
  // valor (PLIEGUES_SELLO) sin tocar este pipeline compartido.
  it('con pliegues explícito, produce esa cantidad de caminos en vez de 7', () => {
    const puntos = trazoDesdeSemilla('cualquiera');
    expect(construirCaminosMandala(puntos, 12, 6)).toHaveLength(6);
    expect(construirCaminosMandala(puntos, 12, 4)).toHaveLength(4);
  });
});
