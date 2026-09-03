import { registroBiomas } from './registroBiomas';

export type CategoriaMapaId = 'estudio' | 'finanzas' | 'habitos' | 'relaciones' | 'rutinas' | 'salud' | 'tareas';
export type LadoMapa = 'izquierda' | 'derecha';

export type TemaMapaProcedural = {
  acento: string;
  categoriaId: CategoriaMapaId;
  densidadDecoracion: number;
  id: string;
};

export type NodoProcedural = { id: string; x: number; y: number };
export type LamparaProcedural = { lado: LadoMapa; tamano: number; x: number; y: number };
export type HojasProcedurales = { lado: LadoMapa; tamano: number; x: number; y: number };
export type BosqueProcedural = { escala: number; variante: 'alto' | 'bajo'; x: number; y: number };
export type DecoracionProcedural = { assetId: string; escala: number; lado: LadoMapa; x: number; y: number };

export type MapaProcedural = {
  decoraciones: DecoracionProcedural[];
  hojas: HojasProcedurales[];
  lamparas: LamparaProcedural[];
  nodos: NodoProcedural[];
};

const hashCadena = (valor: string) => Array.from(valor).reduce((hash, caracter) => ((hash << 5) - hash + caracter.charCodeAt(0)) | 0, 2166136261) >>> 0;

function crearAleatorio(seed: string) {
  let estado = hashCadena(seed) || 1;
  return () => {
    estado = (estado * 1664525 + 1013904223) >>> 0;
    return estado / 4294967296;
  };
}

export function crearTemaMapa(categoriaId: CategoriaMapaId, acento: string, id: string): TemaMapaProcedural {
  return { acento, categoriaId, densidadDecoracion: registroBiomas[categoriaId].densidadDecoracion, id };
}

export function generarMapaProcedural({ ancho, cantidadNodos, tema }: { ancho: number; cantidadNodos: number; tema: TemaMapaProcedural }): MapaProcedural {
  const aleatorio = crearAleatorio(`${tema.categoriaId}:${tema.id}`);
  const centro = ancho / 2;
  const nodos: NodoProcedural[] = [];
  const lamparas: LamparaProcedural[] = [];
  const hojas: HojasProcedurales[] = [];
  const decoraciones: DecoracionProcedural[] = [];
  const assetsBioma = registroBiomas[tema.categoriaId].assets;

  for (let indice = 0; indice < cantidadNodos; indice += 1) {
    const signo = indice === 0 ? 0 : indice % 2 === 0 ? 1 : -1;
    const amplitud = indice === 0 ? 0 : 34 + Math.round(aleatorio() * 12);
    const x = centro + signo * amplitud;
    const y = 54 + indice * 112;
    nodos.push({ id: `nodo-${indice}`, x, y });

    if (indice === 0) continue;

    const nodoEstaIzquierda = x < centro;
    const ladoLampara: LadoMapa = nodoEstaIzquierda ? 'derecha' : 'izquierda';
    const ladoDecoracion: LadoMapa = nodoEstaIzquierda ? 'izquierda' : 'derecha';
    const tamanoHojas = 30 + Math.round(aleatorio() * 5);
    const altoHojas = tamanoHojas * (35 / 26);
    const margenNodo = 33;

    hojas.push({
      lado: ladoLampara,
      tamano: tamanoHojas,
      x: ladoLampara === 'derecha' ? x + margenNodo : x - tamanoHojas - margenNodo,
      y: y - altoHojas / 2,
    });

    lamparas.push({
      lado: ladoLampara,
      tamano: 23 + Math.round(aleatorio() * 3),
      x: ladoLampara === 'derecha' ? ancho - 128 : 84,
      y: y - 16,
    });

    if (aleatorio() < tema.densidadDecoracion && assetsBioma.length > 0) {
      const asset = assetsBioma[Math.floor(aleatorio() * assetsBioma.length)];
      const escala = 0.8 + aleatorio() * 0.28;
      const anchoBase = 172 * escala;
      decoraciones.push({
        assetId: asset.id,
        escala,
        lado: ladoDecoracion,
        // The asset is deliberately clipped by the outer edge and never overlaps a node.
        x: ladoDecoracion === 'izquierda' ? -anchoBase * 0.46 : ancho - anchoBase * 0.54,
        y: y - 86 - aleatorio() * 22,
      });
    }
  }

  return { decoraciones, hojas, lamparas, nodos };
}
