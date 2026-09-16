import type { ImageSourcePropType } from 'react-native';

import { ARBUSTO_SELVA_BASE, obtenerAssetsSelvaPorTono } from '../../habitos/iconosHabitos';
import { obtenerAssetsPaquete } from './registroPaquetesArbol';
import type { CategoriaMapaId } from './mapaProcedural';

export type AssetBioma = {
  id: string;
  fuente: ImageSourcePropType;
  nombre: string;
  rol: RolAssetBioma;
};

export type BiomaVisualId = 'arce' | 'bosque-calido' | 'bosque-dorado' | 'cerezo' | 'pino-nevado' | 'sauce-ruinas' | 'selva';
export type RolAssetBioma = 'arbol-principal' | 'arbol-secundario' | 'arbol-terciario' | 'arbusto' | 'base' | 'flor';

// Pasto/roca: los únicos assets que NO varían por bioma — mismos pasto/roca
// para los 7 biomas, como relleno ambiental disperso (ver mapaProcedural.ts).
export const ASSETS_AMBIENTE_UNIVERSAL: Record<'pasto' | 'pasto1' | 'pasto2' | 'roca' | 'roca1', ImageSourcePropType> = {
  pasto: require('../../../../assets/ilustraciones/senderos/biomas/arboles/pasto.png'),
  pasto1: require('../../../../assets/ilustraciones/senderos/biomas/arboles/pasto1.png'),
  pasto2: require('../../../../assets/ilustraciones/senderos/biomas/arboles/pasto2.png'),
  roca: require('../../../../assets/ilustraciones/senderos/biomas/arboles/roca.png'),
  roca1: require('../../../../assets/ilustraciones/senderos/biomas/arboles/roca1.png'),
};

export type ReglaBioma = {
  assets: AssetBioma[];
  biomaId: BiomaVisualId;
  densidadDecoracion: number;
  presupuestoDecoracion: number;
  promptBase: string;
};

const guiaIsometrica = 'isometric mobile-game scenery, isolated transparent PNG, no background, camera at 3/4 view, light from upper right, shadow toward lower left, clean premium stylized details, no text, no characters';

export const registroBiomas: Record<CategoriaMapaId, ReglaBioma> = {
  rutinas: {
    biomaId: 'pino-nevado',
    assets: [
      { id: 'base', fuente: require('../../../../assets/ilustraciones/senderos/biomas/arboles/pino-nevado-03.png'), nombre: 'Base Pino nevado', rol: 'base' },
      { id: 'pino-nevado-01', fuente: require('../../../../assets/ilustraciones/senderos/biomas/arboles/pino-nevado-01.png'), nombre: 'Árbol Pino nevado 1', rol: 'arbol-principal' },
      { id: 'pino-nevado-02', fuente: require('../../../../assets/ilustraciones/senderos/biomas/arboles/pino-nevado-02.png'), nombre: 'Árbol Pino nevado 2', rol: 'arbol-secundario' },
      { id: 'pino-nevado-04', fuente: require('../../../../assets/ilustraciones/senderos/biomas/arboles/pino-nevado-04.png'), nombre: 'Arbusto Pino nevado 1', rol: 'arbusto' },
      { id: 'pino-nevado-05', fuente: require('../../../../assets/ilustraciones/senderos/biomas/arboles/pino-nevado-05.png'), nombre: 'Arbusto Pino nevado 2', rol: 'arbusto' },
      { id: 'pino-nevado-06', fuente: require('../../../../assets/ilustraciones/senderos/biomas/arboles/pino-nevado-06.png'), nombre: 'Arbusto Pino nevado 3', rol: 'arbusto' },
      { id: 'pino-nevado-07', fuente: require('../../../../assets/ilustraciones/senderos/biomas/arboles/pino-nevado-07.png'), nombre: 'Flor Pino nevado', rol: 'flor' }
    ],
    densidadDecoracion: 0.72,
    presupuestoDecoracion: 13,
    promptBase: `${guiaIsometrica}, cold winter biome, snow-covered pine tree, icy blue palette, cozy but calm`,
  },
  salud: {
    biomaId: 'selva',
    assets: [
      { id: 'base', fuente: require('../../../../assets/ilustraciones/senderos/biomas/arboles/selva-03.png'), nombre: 'Base Selva', rol: 'base' },
      { id: 'selva-01', fuente: require('../../../../assets/ilustraciones/senderos/biomas/arboles/selva-01.png'), nombre: 'Árbol Selva 1', rol: 'arbol-principal' },
      { id: 'selva-02', fuente: require('../../../../assets/ilustraciones/senderos/biomas/arboles/selva-02.png'), nombre: 'Árbol Selva 2', rol: 'arbol-secundario' },
      { id: 'selva-04', fuente: require('../../../../assets/ilustraciones/senderos/biomas/arboles/selva-04.png'), nombre: 'Arbusto Selva 1', rol: 'arbusto' },
      { id: 'selva-05', fuente: require('../../../../assets/ilustraciones/senderos/biomas/arboles/selva-05.png'), nombre: 'Arbusto Selva 2', rol: 'arbusto' },
      { id: 'selva-06', fuente: require('../../../../assets/ilustraciones/senderos/biomas/arboles/selva-06.png'), nombre: 'Arbusto Selva 3', rol: 'arbusto' },
      { id: 'selva-07', fuente: require('../../../../assets/ilustraciones/senderos/biomas/arboles/selva-07.png'), nombre: 'Flor Selva', rol: 'flor' }
    ],
    densidadDecoracion: 0.82,
    presupuestoDecoracion: 13,
    promptBase: `${guiaIsometrica}, lush deep-green forest biome, tropical leaves, moss and natural water`,
  },
  tareas: {
    biomaId: 'bosque-dorado',
    assets: [
      { id: 'base', fuente: require('../../../../assets/ilustraciones/senderos/biomas/arboles/bosque-dorado-03.png'), nombre: 'Base Bosque dorado', rol: 'base' },
      { id: 'bosque-dorado-01', fuente: require('../../../../assets/ilustraciones/senderos/biomas/arboles/bosque-dorado-01.png'), nombre: 'Árbol Bosque dorado 1', rol: 'arbol-principal' },
      { id: 'bosque-dorado-02', fuente: require('../../../../assets/ilustraciones/senderos/biomas/arboles/bosque-dorado-02.png'), nombre: 'Árbol Bosque dorado 2', rol: 'arbol-secundario' },
      { id: 'bosque-dorado-04', fuente: require('../../../../assets/ilustraciones/senderos/biomas/arboles/bosque-dorado-04.png'), nombre: 'Arbusto Bosque dorado 1', rol: 'arbusto' },
      { id: 'bosque-dorado-05', fuente: require('../../../../assets/ilustraciones/senderos/biomas/arboles/bosque-dorado-05.png'), nombre: 'Arbusto Bosque dorado 2', rol: 'arbusto' },
      { id: 'bosque-dorado-06', fuente: require('../../../../assets/ilustraciones/senderos/biomas/arboles/bosque-dorado-06.png'), nombre: 'Arbusto Bosque dorado 3', rol: 'arbusto' },
      { id: 'bosque-dorado-07', fuente: require('../../../../assets/ilustraciones/senderos/biomas/arboles/bosque-dorado-07.png'), nombre: 'Flor Bosque dorado', rol: 'flor' }
    ],
    densidadDecoracion: 0.68,
    presupuestoDecoracion: 13,
    promptBase: `${guiaIsometrica}, warm golden-yellow forest biome, autumn foliage, organized trail markers`,
  },
  habitos: {
    biomaId: 'arce',
    assets: [
      { id: 'base', fuente: require('../../../../assets/ilustraciones/senderos/biomas/arboles/arce-03.png'), nombre: 'Base Arce rojo', rol: 'base' },
      { id: 'arce-01', fuente: require('../../../../assets/ilustraciones/senderos/biomas/arboles/arce-01.png'), nombre: 'Árbol Arce rojo 1', rol: 'arbol-principal' },
      { id: 'arce-02', fuente: require('../../../../assets/ilustraciones/senderos/biomas/arboles/arce-02.png'), nombre: 'Árbol Arce rojo 2', rol: 'arbol-secundario' },
      { id: 'arce-04', fuente: require('../../../../assets/ilustraciones/senderos/biomas/arboles/arce-04.png'), nombre: 'Arbusto Arce rojo 1', rol: 'arbusto' },
      { id: 'arce-05', fuente: require('../../../../assets/ilustraciones/senderos/biomas/arboles/arce-05.png'), nombre: 'Arbusto Arce rojo 2', rol: 'arbusto' },
      { id: 'arce-06', fuente: require('../../../../assets/ilustraciones/senderos/biomas/arboles/arce-06.png'), nombre: 'Arbusto Arce rojo 3', rol: 'arbusto' },
      { id: 'arce-07', fuente: require('../../../../assets/ilustraciones/senderos/biomas/arboles/arce-07.png'), nombre: 'Flor Arce rojo', rol: 'flor' }
    ],
    densidadDecoracion: 0.7,
    presupuestoDecoracion: 13,
    promptBase: `${guiaIsometrica}, vivid red maple forest biome, falling leaves, disciplined autumn garden`,
  },
  relaciones: {
    biomaId: 'cerezo',
    assets: [
      { id: 'base', fuente: require('../../../../assets/ilustraciones/senderos/biomas/arboles/cerezo-03.png'), nombre: 'Base Cerezo japonés', rol: 'base' },
      { id: 'cerezo-01', fuente: require('../../../../assets/ilustraciones/senderos/biomas/arboles/cerezo-01.png'), nombre: 'Árbol Cerezo japonés 1', rol: 'arbol-principal' },
      { id: 'cerezo-02', fuente: require('../../../../assets/ilustraciones/senderos/biomas/arboles/cerezo-02.png'), nombre: 'Árbol Cerezo japonés 2', rol: 'arbol-secundario' },
      { id: 'cerezo-04', fuente: require('../../../../assets/ilustraciones/senderos/biomas/arboles/cerezo-04.png'), nombre: 'Arbusto Cerezo japonés 1', rol: 'arbusto' },
      { id: 'cerezo-05', fuente: require('../../../../assets/ilustraciones/senderos/biomas/arboles/cerezo-05.png'), nombre: 'Arbusto Cerezo japonés 2', rol: 'arbusto' },
      { id: 'cerezo-06', fuente: require('../../../../assets/ilustraciones/senderos/biomas/arboles/cerezo-06.png'), nombre: 'Arbusto Cerezo japonés 3', rol: 'arbusto' },
      { id: 'cerezo-07', fuente: require('../../../../assets/ilustraciones/senderos/biomas/arboles/cerezo-07.png'), nombre: 'Flor Cerezo japonés', rol: 'flor' }
    ],
    densidadDecoracion: 0.68,
    presupuestoDecoracion: 13,
    promptBase: `${guiaIsometrica}, Japanese cherry blossom biome, soft pink sakura petals, elegant garden path`,
  },
  finanzas: {
    biomaId: 'bosque-calido',
    assets: [
      { id: 'base', fuente: require('../../../../assets/ilustraciones/senderos/biomas/arboles/bosque-calido-03.png'), nombre: 'Base Bosque cálido', rol: 'base' },
      { id: 'bosque-calido-01', fuente: require('../../../../assets/ilustraciones/senderos/biomas/arboles/bosque-calido-01.png'), nombre: 'Árbol Bosque cálido 1', rol: 'arbol-principal' },
      { id: 'bosque-calido-02', fuente: require('../../../../assets/ilustraciones/senderos/biomas/arboles/bosque-calido-02.png'), nombre: 'Árbol Bosque cálido 2', rol: 'arbol-secundario' },
      { id: 'bosque-calido-04', fuente: require('../../../../assets/ilustraciones/senderos/biomas/arboles/bosque-calido-04.png'), nombre: 'Arbusto Bosque cálido 1', rol: 'arbusto' },
      { id: 'bosque-calido-05', fuente: require('../../../../assets/ilustraciones/senderos/biomas/arboles/bosque-calido-05.png'), nombre: 'Arbusto Bosque cálido 2', rol: 'arbusto' },
      { id: 'bosque-calido-06', fuente: require('../../../../assets/ilustraciones/senderos/biomas/arboles/bosque-calido-06.png'), nombre: 'Arbusto Bosque cálido 3', rol: 'arbusto' },
      { id: 'bosque-calido-07', fuente: require('../../../../assets/ilustraciones/senderos/biomas/arboles/bosque-calido-07.png'), nombre: 'Flor Bosque cálido', rol: 'flor' }
    ],
    densidadDecoracion: 0.64,
    presupuestoDecoracion: 13,
    promptBase: `${guiaIsometrica}, warm orange woodland biome, amber foliage, subtle wealth and crafted stone details`,
  },
  estudio: {
    biomaId: 'sauce-ruinas',
    assets: [
      { id: 'base', fuente: require('../../../../assets/ilustraciones/senderos/biomas/arboles/sauce-ruinas-03.png'), nombre: 'Base Sauce y ruinas', rol: 'base' },
      { id: 'sauce-ruinas-01', fuente: require('../../../../assets/ilustraciones/senderos/biomas/arboles/sauce-ruinas-01.png'), nombre: 'Árbol Sauce y ruinas 1', rol: 'arbol-principal' },
      { id: 'sauce-ruinas-02', fuente: require('../../../../assets/ilustraciones/senderos/biomas/arboles/sauce-ruinas-02.png'), nombre: 'Árbol Sauce y ruinas 2', rol: 'arbol-secundario' },
      { id: 'sauce-ruinas-04', fuente: require('../../../../assets/ilustraciones/senderos/biomas/arboles/sauce-ruinas-04.png'), nombre: 'Arbusto Sauce y ruinas 1', rol: 'arbusto' },
      { id: 'sauce-ruinas-05', fuente: require('../../../../assets/ilustraciones/senderos/biomas/arboles/sauce-ruinas-05.png'), nombre: 'Arbusto Sauce y ruinas 2', rol: 'arbusto' },
      { id: 'sauce-ruinas-06', fuente: require('../../../../assets/ilustraciones/senderos/biomas/arboles/sauce-ruinas-06.png'), nombre: 'Arbusto Sauce y ruinas 3', rol: 'arbusto' },
      { id: 'sauce-ruinas-07', fuente: require('../../../../assets/ilustraciones/senderos/biomas/arboles/sauce-ruinas-07.png'), nombre: 'Flor Sauce y ruinas', rol: 'flor' }
    ],
    densidadDecoracion: 0.72,
    presupuestoDecoracion: 13,
    promptBase: `${guiaIsometrica}, mystical purple biome, weeping willow, ancient carved stones and subtle ruins`,
  },
};

// El bioma de 'habitos' ya no es un set fijo de assets (era 'arce', un mockup
// sin relación con el hábito real) — se construye en vivo a partir del
// paquete de árbol asignado al hábito (fijo de por vida, ver
// habitos_items.paquete_id) y su nivel real (1-7, define qué etapas de
// crecimiento se ven). Si el paquete todavía no tiene arte nuevo cargado en
// registroPaquetesArbol (hoy: todos los "verde-N" gratuitos, y cualquier
// paquete premium sin migrar), se usa el sistema viejo por tono como puente —
// un solo asset por rol, igual que siempre. Cuando el paquete SÍ tiene sus 7
// etapas reales, se arma la mezcla de hasta 3 profundidades (actual y las 2
// anteriores) que resuelve mapaProcedural.ts.
function construirAssetsBiomaHabitosPuente(paqueteId: string): AssetBioma[] {
  const tono = Number(paqueteId.replace('verde-', '')) || 1;
  const assets = obtenerAssetsSelvaPorTono(tono);
  return [
    { id: 'base', fuente: assets.base, nombre: `Base Selva nivel ${tono}`, rol: 'base' },
    { id: 'arbol-principal', fuente: assets.arbolPrincipal, nombre: `Árbol Selva 1 nivel ${tono}`, rol: 'arbol-principal' },
    { id: 'arbol-secundario', fuente: assets.arbolSecundario, nombre: `Árbol Selva 2 nivel ${tono}`, rol: 'arbol-secundario' },
    { id: 'arbusto', fuente: ARBUSTO_SELVA_BASE, nombre: 'Arbusto Selva', rol: 'arbusto' },
    { id: 'flor', fuente: assets.flor, nombre: `Flor Selva nivel ${tono}`, rol: 'flor' },
  ];
}

function construirAssetsBiomaHabitos(paqueteId: string, nivel: number): AssetBioma[] {
  const paquete = obtenerAssetsPaquete(paqueteId);
  if (!paquete) return construirAssetsBiomaHabitosPuente(paqueteId);

  const nivelAcotado = Math.max(1, Math.min(7, Math.round(nivel)));
  const assets: AssetBioma[] = [
    // Sin arte de "base" propio en el paquete (10 imágenes: 7 etapas +
    // arbusto + flor + semilla) — se reusa la etapa actual como sustituto.
    { id: 'base', fuente: paquete.etapas[nivelAcotado - 1], nombre: `${paqueteId} base nivel ${nivelAcotado}`, rol: 'base' },
    { id: 'arbusto', fuente: paquete.arbusto, nombre: `${paqueteId} arbusto`, rol: 'arbusto' },
    { id: 'flor', fuente: paquete.flor, nombre: `${paqueteId} flor`, rol: 'flor' },
  ];

  const rolesPorProfundidad: RolAssetBioma[] = ['arbol-principal', 'arbol-secundario', 'arbol-terciario'];
  for (let profundidad = 0; profundidad < 3; profundidad += 1) {
    const indiceEtapa = nivelAcotado - 1 - profundidad;
    if (indiceEtapa < 0) break;
    assets.push({
      id: `${rolesPorProfundidad[profundidad]}`,
      fuente: paquete.etapas[indiceEtapa],
      nombre: `${paqueteId} etapa ${indiceEtapa + 1}`,
      rol: rolesPorProfundidad[profundidad],
    });
  }

  return assets;
}

/** Assets del bioma para una categoría — 'habitos' se recalcula por paquete+nivel, el resto es fijo. */
export function obtenerAssetsBioma(categoriaId: CategoriaMapaId, paqueteId?: string, nivel?: number): AssetBioma[] {
  if (categoriaId === 'habitos') return construirAssetsBiomaHabitos(paqueteId ?? 'verde-1', nivel ?? 1);
  return registroBiomas[categoriaId].assets;
}

export function obtenerAssetBioma(categoriaId: CategoriaMapaId, id: string, paqueteId?: string, nivel?: number) {
  return obtenerAssetsBioma(categoriaId, paqueteId, nivel).find((asset) => asset.id === id) ?? null;
}
