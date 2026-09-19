import { describe, expect, it, vi } from 'vitest';

vi.mock('./registroBiomas', () => {
  const registroBiomas = {
    estudio: { biomaId: 'sauce-ruinas', densidadDecoracion: 0.72, presupuestoDecoracion: 13, assets: [{ id: 'base', rol: 'base' }, { id: 'sauce-ruinas-01', rol: 'arbol-principal' }, { id: 'sauce-ruinas-02', rol: 'arbol-secundario' }, { id: 'sauce-ruinas-04', rol: 'arbusto' }, { id: 'sauce-ruinas-07', rol: 'flor' }] },
    rutinas: { biomaId: 'pino-nevado', densidadDecoracion: 0.72, presupuestoDecoracion: 13, assets: [{ id: 'base', rol: 'base' }, { id: 'pino-nevado-01', rol: 'arbol-principal' }, { id: 'pino-nevado-02', rol: 'arbol-secundario' }, { id: 'pino-nevado-04', rol: 'arbusto' }, { id: 'pino-nevado-07', rol: 'flor' }] },
    habitos: {
      biomaId: 'albedo', densidadDecoracion: 0.72, presupuestoDecoracion: 500,
      assets: [
        { id: 'base', rol: 'base' },
        { id: 'albedo-p', rol: 'arbol-principal' },
        { id: 'albedo-s', rol: 'arbol-secundario' },
        { id: 'albedo-t', rol: 'arbol-terciario' },
        { id: 'albedo-arbusto', rol: 'arbusto' },
        { id: 'albedo-flor', rol: 'flor' },
      ],
    },
  };
  return {
    registroBiomas,
    obtenerAssetsBioma: (categoriaId: keyof typeof registroBiomas, _paqueteId?: string, nivel = 7) => {
      const assets = registroBiomas[categoriaId].assets;
      if (categoriaId !== 'habitos') return assets;
      const rolesVisibles = nivel <= 1
        ? ['base', 'arbol-principal', 'arbusto', 'flor']
        : nivel === 2
          ? ['base', 'arbol-principal', 'arbol-secundario', 'arbusto', 'flor']
          : undefined;
      return rolesVisibles ? assets.filter((asset) => rolesVisibles.includes(asset.rol)) : assets;
    },
  };
});

import { crearTemaMapa, generarMapaProcedural } from './mapaProcedural';

describe('generarMapaProcedural', () => {
  it('permite acercar el primer nodo al borde superior en vistas compactas', () => {
    const tema = crearTemaMapa('habitos', '#22C55E', 'onboarding-compacto', 'albedo', 2, undefined, true);
    const mapa = generarMapaProcedural({
      ancho: 360,
      cantidadNodos: 4,
      desplazamientoSuperior: 60,
      tema,
    });

    expect(mapa.nodos[0].y).toBe(60);
    expect(mapa.nodos[1].y).toBe(172);
  });

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
    expect(mapa.piedras.length).toBeGreaterThanOrEqual(4);
    expect(mapa.piedras.length).toBeLessThanOrEqual(6);
    expect(mapa.piedras.every((piedras) => piedras.assetId === 'roca' || piedras.assetId === 'roca1')).toBe(true);
    for (const piedras of mapa.piedras) {
      const centroPiedras = { x: piedras.x + piedras.tamano / 2, y: piedras.y + piedras.tamano * 0.3 };
      const lamparaAsociada = mapa.lamparas[piedras.lamparaIndice];
      expect(Math.hypot(centroPiedras.x - lamparaAsociada.x, centroPiedras.y - lamparaAsociada.y)).toBeLessThanOrEqual(62);
    }
    expect(mapa.piedras.every((piedras) => Number.isFinite(piedras.desplazamientoX) && Number.isFinite(piedras.desplazamientoY))).toBe(true);
    expect(mapa.piedras.some((piedras) => piedras.desplazamientoX !== 0 || piedras.desplazamientoY !== 0)).toBe(true);
  });

  it('esparce mucho pasto/roca ambiental universal (5 variantes), sin pisar nada más', () => {
    const tema = crearTemaMapa('estudio', '#7453B6', 'sendero-ambiente');
    const mapa = generarMapaProcedural({ ancho: 360, cantidadNodos: 6, tema });

    expect(mapa.ambiente.length).toBeGreaterThan(15);
    expect(mapa.ambiente.every((item) => ['pasto', 'pasto1', 'pasto2', 'roca', 'roca1'].includes(item.assetId))).toBe(true);
    expect(mapa.ambiente.every((item) => item.escala >= 0.18 && item.escala <= 0.34)).toBe(true);
    expect(mapa.ambiente.every((item) => [0.3, 0.6, 1].includes(item.opacidad))).toBe(true);
    expect(new Set(mapa.ambiente.map((item) => item.opacidad)).size).toBe(3);

    const cajaDe = (x: number, y: number, escala: number) => {
      const tamano = 172 * escala;
      return { x: x + tamano * 0.18, y: y + tamano * 0.22, w: tamano * 0.64, h: tamano * 0.62 };
    };
    const chocan = (a: { x: number; y: number; w: number; h: number }, b: { x: number; y: number; w: number; h: number }) =>
      a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
    const cajasDecoracion = mapa.decoraciones.map((d) => cajaDe(d.x, d.y, d.escala));

    for (const [indice, item] of mapa.ambiente.entries()) {
      const tamano = 172 * item.escala;
      const centro = { x: item.x + tamano / 2, y: item.y + tamano / 2 };
      for (const nodo of mapa.nodos) expect(Math.hypot(centro.x - nodo.x, centro.y - nodo.y)).toBeGreaterThan(64);
      const caja = cajaDe(item.x, item.y, item.escala);
      expect(cajasDecoracion.some((d) => chocan(caja, d))).toBe(false);
      for (const [otroIndice, otro] of mapa.ambiente.entries()) {
        if (otroIndice === indice) continue;
        expect(chocan(caja, cajaDe(otro.x, otro.y, otro.escala))).toBe(false);
      }
    }
  });

  it('mezcla etapas de árbol por profundidad ~70/20/10 cuando el bioma expone arbol-terciario', () => {
    // nivel 4: ninguna de las 3 profundidades cae en "etapa 1" (que nunca se
    // dibuja como árbol protagonista, ver mapaProcedural.ts), así que el
    // sorteo ponderado se puede medir sin que se pierdan árboles del 70%.
    const tema = crearTemaMapa('habitos', '#22C55E', 'sendero-profundidad', 'albedo', 4, undefined, true);
    const mapa = generarMapaProcedural({ ancho: 360, cantidadNodos: 60, tema });

    const arboles = mapa.decoraciones.filter((decoracion) => decoracion.assetId.startsWith('albedo-') && decoracion.assetId !== 'albedo-arbusto' && decoracion.assetId !== 'albedo-flor');
    expect(arboles.length).toBeGreaterThan(30);

    const porProfundidad = { principal: 0, secundario: 0, terciario: 0 };
    for (const arbol of arboles) {
      if (arbol.assetId === 'albedo-p') { porProfundidad.principal += 1; expect(arbol.capa).toBe('frente'); }
      else if (arbol.assetId === 'albedo-s') { porProfundidad.secundario += 1; expect(arbol.capa).toBe('medio'); }
      else if (arbol.assetId === 'albedo-t') { porProfundidad.terciario += 1; expect(arbol.capa).toBe('fondo'); }
    }
    // Tolerancia amplia (rango, no igualdad exacta) — es una elección al azar
    // ponderada, no una distribución exacta con una sola corrida.
    const total = arboles.length;
    // Las colisiones descartan piezas después del sorteo; por eso la escena
    // determinista no conserva una proporción exacta de 70/20/10.
    expect(porProfundidad.principal / total).toBeGreaterThan(0.4);
    expect(porProfundidad.terciario / total).toBeLessThan(porProfundidad.secundario / total);
    expect(porProfundidad.secundario / total).toBeLessThanOrEqual(porProfundidad.principal / total);
  });

  it('intercala algunos árboles de etapa entre nodos consecutivos de un paquete real', () => {
    const tema = crearTemaMapa('habitos', '#22C55E', 'sendero-intermedio', 'albedo', 4, undefined, true);
    const mapa = generarMapaProcedural({ ancho: 360, cantidadNodos: 60, tema });
    const arbolesIntermedios = mapa.decoraciones.filter((decoracion) => {
      if (!decoracion.assetId.startsWith('albedo-') || decoracion.etapa === undefined) return false;
      const tamano = 172 * decoracion.escala;
      const baseArbol = decoracion.y + tamano * 0.62;
      return mapa.nodos.slice(0, -1).some((nodo, indice) => Math.abs(baseArbol - (nodo.y + mapa.nodos[indice + 1].y) / 2) < 0.01);
    });

    expect(arbolesIntermedios.length).toBeGreaterThan(0);
    expect(arbolesIntermedios.some((decoracion) => {
      const tamano = 172 * decoracion.escala;
      return decoracion.x < 0 || decoracion.x + tamano > 360;
    })).toBe(true);
  });

  it('mantiene los niveles tempranos con la misma estructura visual, sin capa extra de semillas o brotes', () => {
    const temaNivel1 = crearTemaMapa('habitos', '#22C55E', 'sendero-semillas-1', 'albedo', 1, undefined, true);
    const mapaNivel1 = generarMapaProcedural({ ancho: 360, cantidadNodos: 6, tema: temaNivel1 });
    expect(mapaNivel1.semillas).toEqual([]);
    expect(mapaNivel1.brotes).toEqual([]);
    expect(mapaNivel1.decoraciones.some((decoracion) => decoracion.etapa === 1)).toBe(true);

    const temaNivel4 = crearTemaMapa('habitos', '#22C55E', 'sendero-semillas-4', 'albedo', 4, undefined, true);
    const mapaNivel4 = generarMapaProcedural({ ancho: 360, cantidadNodos: 6, tema: temaNivel4 });
    expect(mapaNivel4.semillas.length).toBe(0);
    expect(mapaNivel4.brotes.length).toBe(0);

    const temaSinArteReal = crearTemaMapa('habitos', '#22C55E', 'sendero-semillas-sin-arte', 'verde-1', 1, undefined, false);
    const mapaSinArteReal = generarMapaProcedural({ ancho: 360, cantidadNodos: 6, tema: temaSinArteReal });
    expect(mapaSinArteReal.semillas.length).toBe(0);
    expect(mapaSinArteReal.brotes.length).toBe(0);
  });

  it('reserva el nodo inicial para dos árboles laterales de su etapa exacta', () => {
    for (const { nivel, tamanoEsperado } of [{ nivel: 1, tamanoEsperado: 80 }, { nivel: 2, tamanoEsperado: 90 }]) {
      const tema = crearTemaMapa('habitos', '#22C55E', `sendero-inicio-${nivel}`, 'albedo', nivel, undefined, true);
      const mapa = generarMapaProcedural({ ancho: 360, cantidadNodos: 6, tema });
      const primerNodo = mapa.nodos[0];
      const arbolesIniciales = mapa.decoraciones.filter((decoracion) => {
        if (!decoracion.assetId.startsWith('albedo-') || decoracion.etapa !== nivel) return false;
        const tamano = 172 * decoracion.escala;
        return Math.abs(decoracion.y + tamano * 0.62 - primerNodo.y) < 0.01;
      });

      expect(arbolesIniciales).toHaveLength(2);
      expect(arbolesIniciales.map((arbol) => 172 * arbol.escala)).toEqual([tamanoEsperado, tamanoEsperado]);
      expect(new Set(arbolesIniciales.map((arbol) => arbol.lado))).toEqual(new Set(['izquierda', 'derecha']));
    }
  });
});
