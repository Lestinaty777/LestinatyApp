import { describe, expect, it, vi } from 'vitest';

vi.mock('./registroBiomas', () => ({
  registroBiomas: {
    estudio: { biomaId: 'sauce-ruinas', densidadDecoracion: 0.72, presupuestoDecoracion: 13, assets: [{ id: 'base', rol: 'base' }, { id: 'sauce-ruinas-01', rol: 'arbol-principal' }, { id: 'sauce-ruinas-02', rol: 'arbol-secundario' }, { id: 'sauce-ruinas-04', rol: 'arbusto' }, { id: 'sauce-ruinas-07', rol: 'flor' }] },
    rutinas: { biomaId: 'pino-nevado', densidadDecoracion: 0.72, presupuestoDecoracion: 13, assets: [{ id: 'base', rol: 'base' }, { id: 'pino-nevado-01', rol: 'arbol-principal' }, { id: 'pino-nevado-02', rol: 'arbol-secundario' }, { id: 'pino-nevado-04', rol: 'arbusto' }, { id: 'pino-nevado-07', rol: 'flor' }] },
  },
}));

import { crearTemaMapa, generarMapaProcedural } from './mapaProcedural';

describe('generarMapaProcedural', () => {
  it('compone un paisaje determinista del bioma real sin exceder su presupuesto visual', () => {
    const tema = crearTemaMapa('estudio', '#7453B6', 'sendero-anatomia');
    const primeraEscena = generarMapaProcedural({ ancho: 360, cantidadNodos: 6, tema });
    const segundaEscena = generarMapaProcedural({ ancho: 360, cantidadNodos: 6, tema });

    expect(tema.biomaId).toBe('sauce-ruinas');
    expect(primeraEscena).toEqual(segundaEscena);
    expect(primeraEscena.decoraciones.length).toBeLessThanOrEqual(tema.presupuestoDecoracion);
    expect(primeraEscena.decoraciones.every((decoracion) => decoracion.assetId.startsWith('sauce-ruinas-'))).toBe(true);
    expect(new Set(primeraEscena.decoraciones.map((decoracion) => decoracion.capa)).size).toBeGreaterThan(1);
  });

  it('mantiene una zona despejada alrededor de cada nodo', () => {
    const tema = crearTemaMapa('rutinas', '#367CFF', 'sendero-rutina');
    const mapa = generarMapaProcedural({ ancho: 360, cantidadNodos: 6, tema });

    for (const decoracion of mapa.decoraciones) {
      const tamano = 172 * decoracion.escala;
      const centroDecoracion = { x: decoracion.x + tamano / 2, y: decoracion.y + tamano / 2 };

      for (const nodo of mapa.nodos) {
        const distancia = Math.hypot(centroDecoracion.x - nodo.x, centroDecoracion.y - nodo.y);
        expect(distancia).toBeGreaterThan(64);
      }
    }
  });

  it('garantiza flores y vegetación de suelo sin saturar el mapa', () => {
    const tema = crearTemaMapa('estudio', '#7453B6', 'sendero-flores');
    const mapa = generarMapaProcedural({ ancho: 360, cantidadNodos: 6, tema });

    expect(mapa.decoraciones.filter((decoracion) => decoracion.assetId.endsWith('-04')).length).toBeGreaterThanOrEqual(2);
    expect(mapa.decoraciones.some((decoracion) => decoracion.assetId.endsWith('-07'))).toBe(true);
    expect(mapa.manchasHojas.length).toBeGreaterThanOrEqual(6);
    expect(mapa.manchasHojas.length).toBeLessThanOrEqual(8);
    expect(mapa.manchasHojas.filter((mancha) => mancha.zona === 'superior')).toHaveLength(2);
    expect(mapa.piedras.length).toBeGreaterThanOrEqual(4);
    expect(mapa.piedras.length).toBeLessThanOrEqual(6);
    for (const piedras of mapa.piedras) {
      const centroPiedras = { x: piedras.x + piedras.tamano / 2, y: piedras.y + piedras.tamano * 0.3 };
      const lamparaAsociada = mapa.lamparas[piedras.lamparaIndice];
      expect(Math.hypot(centroPiedras.x - lamparaAsociada.x, centroPiedras.y - lamparaAsociada.y)).toBeLessThanOrEqual(62);
    }
    expect(mapa.piedras.every((piedras) => Number.isFinite(piedras.desplazamientoX) && Number.isFinite(piedras.desplazamientoY))).toBe(true);
    expect(mapa.piedras.some((piedras) => piedras.desplazamientoX !== 0 || piedras.desplazamientoY !== 0)).toBe(true);
    const hojasDeTramo = mapa.manchasHojas.filter((mancha) => mancha.zona === 'tramo');
    for (let indice = 1; indice < hojasDeTramo.length; indice += 1) {
      expect(Math.abs(hojasDeTramo[indice].y - hojasDeTramo[indice - 1].y)).toBeGreaterThanOrEqual(80);
      expect(hojasDeTramo[indice].espejoHorizontal).toBe(-hojasDeTramo[indice - 1].espejoHorizontal);
    }
  });
});
