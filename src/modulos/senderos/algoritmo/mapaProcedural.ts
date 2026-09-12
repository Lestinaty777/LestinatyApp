import { obtenerAssetsBioma, registroBiomas, type AssetBioma } from './registroBiomas';

export type CategoriaMapaId = 'estudio' | 'finanzas' | 'habitos' | 'relaciones' | 'rutinas' | 'salud' | 'tareas';
export type LadoMapa = 'izquierda' | 'derecha';
export type CapaDecoracion = 'fondo' | 'medio' | 'frente';

export type TemaMapaProcedural = {
  acento: string;
  biomaId: string;
  categoriaId: CategoriaMapaId;
  densidadDecoracion: number;
  id: string;
  presupuestoDecoracion: number;
  /** Nivel real 1-7 del hábito — solo se usa para la categoría 'habitos', define qué assets de selva se cargan. */
  tono?: number;
};

export type NodoProcedural = { id: string; x: number; y: number };
export type LamparaProcedural = { lado: LadoMapa; tamano: number; x: number; y: number };
export type HojasProcedurales = { lado: LadoMapa; tamano: number; x: number; y: number };
export type ManchaHojasProcedural = HojasProcedurales & { espejoHorizontal: -1 | 1; zona: 'superior' | 'tramo' };
export type PiedrasProcedurales = {
  desplazamientoX: number;
  desplazamientoY: number;
  espejoHorizontal: -1 | 1;
  lamparaIndice: number;
  tamano: number;
  x: number;
  y: number;
};
export type DecoracionProcedural = {
  assetId: string;
  capa: CapaDecoracion;
  escala: number;
  lado: LadoMapa;
  x: number;
  y: number;
  volteado?: boolean;
};

export type MapaProcedural = {
  decoraciones: DecoracionProcedural[];
  hojas: HojasProcedurales[];
  lamparas: LamparaProcedural[];
  manchasHojas: ManchaHojasProcedural[];
  nodos: NodoProcedural[];
  piedras: PiedrasProcedurales[];
};

type CajaColision = { x: number; y: number; w: number; h: number };
type RolDecoracion = 'arbol-principal' | 'arbol-secundario' | 'arbusto' | 'flor';

const TAMANO_BASE_ASSET = 172;
const SEPARACION_NODOS = 112;
const LIMPIEZA_NODO = 68;

const hashCadena = (valor: string) => Array.from(valor).reduce((hash, caracter) => ((hash << 5) - hash + caracter.charCodeAt(0)) | 0, 2166136261) >>> 0;

function crearAleatorio(seed: string) {
  let estado = hashCadena(seed) || 1;
  return () => {
    estado = (estado * 1664525 + 1013904223) >>> 0;
    return estado / 4294967296;
  };
}

function hayColision(caja: CajaColision, cajas: readonly CajaColision[]) {
  return cajas.some((existente) => caja.x < existente.x + existente.w && caja.x + caja.w > existente.x && caja.y < existente.y + existente.h && caja.y + caja.h > existente.y);
}

function crearCaja(x: number, y: number, tamano: number): CajaColision {
  return { x: x + tamano * 0.18, y: y + tamano * 0.22, w: tamano * 0.64, h: tamano * 0.62 };
}

export function crearTemaMapa(categoriaId: CategoriaMapaId, acento: string, id: string, tono?: number): TemaMapaProcedural {
  const regla = registroBiomas[categoriaId];
  return {
    acento,
    biomaId: regla.biomaId,
    categoriaId,
    densidadDecoracion: regla.densidadDecoracion,
    id,
    presupuestoDecoracion: regla.presupuestoDecoracion,
    tono,
  };
}

export function generarMapaProcedural({ ancho, cantidadNodos, tema }: { ancho: number; cantidadNodos: number; tema: TemaMapaProcedural }): MapaProcedural {
  const aleatorio = crearAleatorio(`${tema.biomaId}:${tema.id}`);
  const centro = ancho / 2;
  const nodos: NodoProcedural[] = [];
  const lamparas: LamparaProcedural[] = [];
  const hojas: HojasProcedurales[] = [];
  const manchasHojas: ManchaHojasProcedural[] = [];
  const piedras: PiedrasProcedurales[] = [];
  const decoraciones: DecoracionProcedural[] = [];
  const cajasProtegidas: CajaColision[] = [{ x: 0, y: -80, w: ancho, h: 80 }];
  const cajasDecoracion: CajaColision[] = [];
  const assets = obtenerAssetsBioma(tema.categoriaId, tema.tono)
    .filter((asset): asset is AssetBioma & { rol: RolDecoracion } => asset.rol !== 'base');
  const assetsPorRol = (rol: RolDecoracion) => assets.filter((asset) => asset.rol === rol);

  for (let indice = 0; indice < cantidadNodos; indice += 1) {
    const signo = indice === 0 ? 0 : indice % 2 === 0 ? 1 : -1;
    const amplitud = indice === 0 ? 0 : 34 + Math.round(aleatorio() * 12);
    const x = centro + signo * amplitud;
    const y = 54 + indice * SEPARACION_NODOS;
    nodos.push({ id: `nodo-${indice}`, x, y });
    cajasProtegidas.push({ x: x - 42, y: y - 42, w: 84, h: 84 });

    if (indice === 0) continue;
    const ladoLampara: LadoMapa = x < centro ? 'derecha' : 'izquierda';
    const tamanoHojas = 30 + Math.round(aleatorio() * 5);
    hojas.push({
      lado: ladoLampara,
      tamano: tamanoHojas,
      x: ladoLampara === 'derecha' ? x + 33 : x - tamanoHojas - 33,
      y: y - (tamanoHojas * 35 / 26) / 2,
    });

    const lamparaX = ladoLampara === 'derecha' ? ancho - 108 : 64;
    const lamparaY = y - 16;
    const tamanoLampara = 23 + Math.round(aleatorio() * 3);
    lamparas.push({ lado: ladoLampara, tamano: tamanoLampara, x: lamparaX, y: lamparaY });
    cajasProtegidas.push({ x: lamparaX - 14, y: lamparaY - 14, w: 58, h: 62 });
  }

  const cantidadManchasHojas = Math.min(nodos.length, Math.min(6, Math.max(4, Math.ceil((nodos.length - 1) * 0.75))));
  const espejoInicial = hashCadena(tema.id) % 2 === 0 ? -1 : 1;
  for (let indice = 0; indice < cantidadManchasHojas; indice += 1) {
    const indiceNodo = Math.min(nodos.length - 1, Math.max(0, Math.floor((indice + 1) * nodos.length / (cantidadManchasHojas + 1))));
    const nodoReferencia = nodos[indiceNodo];
    const lado: LadoMapa = indice % 2 === 0 ? 'izquierda' : 'derecha';
    const tamano = 58 + Math.round(aleatorio() * 20);
    manchasHojas.push({
      lado,
      tamano,
      x: lado === 'izquierda' ? 8 + Math.round(aleatorio() * 24) : ancho - tamano - 8 - Math.round(aleatorio() * 24),
      y: nodoReferencia.y - tamano * 0.42,
      espejoHorizontal: indice % 2 === 0 ? espejoInicial : (espejoInicial * -1) as -1 | 1,
      zona: 'tramo',
    });
  }

  for (const lado of ['izquierda', 'derecha'] as const) {
    const tamano = 72 + Math.round(aleatorio() * 16);
    manchasHojas.push({
      lado,
      tamano,
      x: lado === 'izquierda' ? -12 : ancho - tamano + 12,
      y: -34 + Math.round(aleatorio() * 18),
      espejoHorizontal: lado === 'derecha' ? 1 : -1,
      zona: 'superior',
    });
  }

  const cantidadPiedras = Math.min(6, Math.max(4, Math.ceil((nodos.length - 1) * 0.8)));
  for (let indice = 0; indice < cantidadPiedras; indice += 1) {
    const indiceNodo = Math.min(nodos.length - 1, Math.max(1, Math.floor((indice + 1) * nodos.length / (cantidadPiedras + 1))));
    const lamparaIndice = Math.max(0, indiceNodo - 1);
    const lamparaAsociada = lamparas[lamparaIndice];
    const tamano = 42 + Math.round(aleatorio() * 12);
    const desplazamientoX = -8 + Math.round(aleatorio() * 16);
    const desplazamientoY = -5 + Math.round(aleatorio() * 10);
    piedras.push({
      desplazamientoX,
      desplazamientoY,
      espejoHorizontal: lamparaAsociada.lado === 'izquierda' ? -1 : 1,
      lamparaIndice,
      tamano,
      x: lamparaAsociada.x - tamano * (lamparaAsociada.lado === 'izquierda' ? 0.25 : 0.75) + desplazamientoX,
      y: lamparaAsociada.y + 36 + desplazamientoY,
    });
  }

  function colocar({ assetId, capa, escala, lado, x, y }: Omit<DecoracionProcedural, 'volteado'>) {
    if (decoraciones.length >= tema.presupuestoDecoracion) return false;
    const tamano = TAMANO_BASE_ASSET * escala;
    const caja = crearCaja(x, y, tamano);
    const centroDecoracion = { x: x + tamano / 2, y: y + tamano / 2 };
    const invadeNodo = nodos.some((nodo) => Math.hypot(centroDecoracion.x - nodo.x, centroDecoracion.y - nodo.y) <= LIMPIEZA_NODO);
    if (invadeNodo || hayColision(caja, cajasProtegidas) || hayColision(caja, cajasDecoracion)) return false;

    decoraciones.push({ assetId, capa, escala, lado, x, y, volteado: aleatorio() > 0.5 });
    cajasDecoracion.push(caja);
    return true;
  }

  // La primera curva siempre recibe una flor antes de colocar árboles: evita que el follaje la oculte.
  const florInicial = assetsPorRol('flor')[0];
  const ladoFlorInicial: LadoMapa = aleatorio() > 0.5 ? 'izquierda' : 'derecha';
  if (florInicial && nodos.length > 1) {
    const escala = 0.24;
    const tamano = TAMANO_BASE_ASSET * escala;
    colocar({
      assetId: florInicial.id,
      capa: 'frente',
      escala,
      lado: ladoFlorInicial,
      x: ladoFlorInicial === 'izquierda' ? 58 : ancho - tamano - 58,
      y: (nodos[0].y + nodos[1].y) / 2 - tamano * 0.4,
    });
  }

  // Dos arbustos laterales aseguran que el sendero no se sienta vacío aun con un bioma poco denso.
  const arbustosIniciales = assetsPorRol('arbusto');
  for (let indice = 0; indice < Math.min(2, arbustosIniciales.length ? 2 : 0, Math.max(0, nodos.length - 1)); indice += 1) {
    const ladoLampara: LadoMapa = nodos[indice + 1].x < centro ? 'derecha' : 'izquierda';
    const lado: LadoMapa = ladoLampara === 'izquierda' ? 'derecha' : 'izquierda';
    const escala = 0.42;
    const tamano = TAMANO_BASE_ASSET * escala;
    colocar({
      assetId: arbustosIniciales[indice % arbustosIniciales.length].id,
      capa: 'medio',
      escala,
      lado,
      x: lado === 'izquierda' ? 10 : ancho - tamano - 10,
      y: (nodos[indice].y + nodos[indice + 1].y) / 2 + 12,
    });
  }

  // Cada tramo alterna su masa vegetal: un árbol encuadra la curva y los detalles acercan el camino.
  for (let indice = 0; indice < nodos.length; indice += 1) {
    const nodo = nodos[indice];
    const lado: LadoMapa = indice % 2 === 0 ? 'izquierda' : 'derecha';
    const arboles = indice % 3 === 0 ? assetsPorRol('arbol-principal') : assetsPorRol('arbol-secundario');
    const arbol = arboles[Math.floor(aleatorio() * arboles.length)];
    if (!arbol) continue;

    const escala = 0.7 + aleatorio() * 0.24;
    const tamano = TAMANO_BASE_ASSET * escala;
    colocar({
      assetId: arbol.id,
      capa: indice % 3 === 0 ? 'frente' : 'fondo',
      escala,
      lado,
      x: lado === 'izquierda' ? -tamano * (0.48 + aleatorio() * 0.14) : ancho - tamano * (0.52 - aleatorio() * 0.14),
      y: nodo.y - tamano * (0.45 + aleatorio() * 0.18),
    });
  }

  for (let indice = 0; indice < Math.max(0, nodos.length - 1); indice += 1) {
    const actual = nodos[indice];
    const siguiente = nodos[indice + 1];
    const lado: LadoMapa = actual.x < centro ? 'derecha' : 'izquierda';
    const centroTramoY = (actual.y + siguiente.y) / 2;

    const flores = assetsPorRol('flor');
    const flor = flores[Math.floor(aleatorio() * flores.length)];
    if (flor && (indice === 0 || aleatorio() < tema.densidadDecoracion * 0.62)) {
      const escala = 0.18 + aleatorio() * 0.1;
      const tamano = TAMANO_BASE_ASSET * escala;
      colocar({
        assetId: flor.id,
        capa: 'frente',
        escala,
        lado,
        x: lado === 'izquierda' ? centro - 96 - aleatorio() * 20 : centro + 62 + aleatorio() * 20,
        y: centroTramoY - tamano * 0.38,
      });
    }

    const arbustos = assetsPorRol('arbusto');
    const arbusto = arbustos[Math.floor(aleatorio() * arbustos.length)];
    if (arbusto && (indice < 2 || aleatorio() < Math.min(0.94, tema.densidadDecoracion + 0.16))) {
      const escala = 0.36 + aleatorio() * 0.2;
      const tamano = TAMANO_BASE_ASSET * escala;
      colocar({
        assetId: arbusto.id,
        capa: 'medio',
        escala,
        lado,
        x: lado === 'izquierda' ? 14 + aleatorio() * 34 : ancho - tamano - 14 - aleatorio() * 34,
        y: centroTramoY - tamano * 0.45,
      });
    }
  }

  return { decoraciones, hojas, lamparas, manchasHojas, nodos, piedras };
}
