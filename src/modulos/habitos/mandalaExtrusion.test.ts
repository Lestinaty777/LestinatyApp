import { describe, expect, it } from 'vitest';

import { prepararPoligonos, proyectarExtrusion, type CamaraMandala } from './mandalaExtrusion';

// Cuadrado de lado 2 centrado en el origen, dado en sentido horario a
// propósito: prepararPoligonos debe darlo vuelta.
const cuadradoHorario = [{ x: -1, y: -1 }, { x: -1, y: 1 }, { x: 1, y: 1 }, { x: 1, y: -1 }];

const camaraBase: CamaraMandala = { centro: 100, distancia: 1e6, escala: 10, giroGrados: 0, grosor: 4, inclinacionGrados: 0 };

function cantidadParedes(paredesPorTono: number[][]) {
  return paredesPorTono.reduce((total, tono) => total + tono.length / 8, 0);
}

describe('prepararPoligonos', () => {
  it('aplana y orienta todo contorno en sentido antihorario', () => {
    const [plano] = prepararPoligonos([cuadradoHorario]);
    let area = 0;
    for (let i = 0; i < plano.length; i += 2) {
      const j = (i + 2) % plano.length;
      area += plano[i] * plano[j + 1] - plano[j] * plano[i + 1];
    }
    expect(area).toBeGreaterThan(0);
  });

  it('descarta contornos vacíos o degenerados', () => {
    expect(prepararPoligonos([[], [{ x: 0, y: 0 }, { x: 1, y: 1 }]])).toEqual([]);
  });
});

describe('proyectarExtrusion', () => {
  const poligonos = prepararPoligonos([cuadradoHorario]);

  it('de frente: se ve la cara frontal, sin paredes, en su lugar', () => {
    const resultado = proyectarExtrusion(poligonos, camaraBase);
    expect(resultado.frenteVisible).toBe(true);
    expect(cantidadParedes(resultado.paredesPorTono)).toBe(0);
    const xs = resultado.cara[0].filter((_, i) => i % 2 === 0);
    expect(Math.min(...xs)).toBeCloseTo(90);
    expect(Math.max(...xs)).toBeCloseTo(110);
  });

  it('girada a un lado muestra sólo la pared de ese lado', () => {
    const resultado = proyectarExtrusion(poligonos, { ...camaraBase, giroGrados: 30 });
    expect(resultado.frenteVisible).toBe(true);
    expect(cantidadParedes(resultado.paredesPorTono)).toBe(1);
  });

  it('pasada la media vuelta se ve el reverso', () => {
    expect(proyectarExtrusion(poligonos, { ...camaraBase, giroGrados: 150 }).frenteVisible).toBe(false);
    expect(proyectarExtrusion(poligonos, { ...camaraBase, giroGrados: 210 }).frenteVisible).toBe(false);
    expect(proyectarExtrusion(poligonos, { ...camaraBase, giroGrados: 330 }).frenteVisible).toBe(true);
  });

  it('recostada también asoma el canto de arriba o de abajo', () => {
    const resultado = proyectarExtrusion(poligonos, { ...camaraBase, giroGrados: 30, inclinacionGrados: -30 });
    expect(cantidadParedes(resultado.paredesPorTono)).toBe(2);
  });

  it('sin grosor no genera paredes', () => {
    const resultado = proyectarExtrusion(poligonos, { ...camaraBase, giroGrados: 40, grosor: 0 });
    expect(cantidadParedes(resultado.paredesPorTono)).toBe(0);
  });

  it('con perspectiva, el lado que se acerca a cámara se ve más grande', () => {
    const resultado = proyectarExtrusion(poligonos, { ...camaraBase, distancia: 150, giroGrados: 40 });
    const [x0, y0, x1, y1, x2, y2, x3, y3] = resultado.cara[0];
    // Los vértices 0-1 y 2-3 son los dos lados verticales del cuadrado.
    const alturaLadoA = Math.abs(y1 - y0);
    const alturaLadoB = Math.abs(y3 - y2);
    const ladoAEsIzquierdo = (x0 + x1) / 2 < (x2 + x3) / 2;
    // Girar +40° acerca el lado izquierdo (x<0) a la cámara.
    expect(ladoAEsIzquierdo ? alturaLadoA > alturaLadoB : alturaLadoB > alturaLadoA).toBe(true);
  });
});
