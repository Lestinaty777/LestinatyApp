import type { ImageSourcePropType } from 'react-native';

import type { CategoriaMapaId } from './mapaProcedural';

export type AssetBioma = {
  id: string;
  fuente: ImageSourcePropType;
  nombre: string;
};

export type ReglaBioma = {
  assets: AssetBioma[];
  densidadDecoracion: number;
  promptBase: string;
};

const guiaIsometrica = 'isometric mobile-game scenery, isolated transparent PNG, no background, camera at 3/4 view, light from upper right, shadow toward lower left, clean premium stylized details, no text, no characters';

export const registroBiomas: Record<CategoriaMapaId, ReglaBioma> = {
  rutinas: {
    assets: [{ id: 'pino-nevado-01', fuente: require('../../../../assets/ilustraciones/senderos/biomas/arboles/pino-nevado-01.png'), nombre: 'Pino nevado' }],
    densidadDecoracion: 0.72,
    promptBase: `${guiaIsometrica}, cold winter biome, snow-covered pine tree, icy blue palette, cozy but calm`,
  },
  salud: {
    assets: [{ id: 'selva-01', fuente: require('../../../../assets/ilustraciones/senderos/biomas/arboles/selva-01.png'), nombre: 'Selva profunda' }],
    densidadDecoracion: 0.82,
    promptBase: `${guiaIsometrica}, lush deep-green forest biome, tropical leaves, moss and natural water`,
  },
  tareas: {
    assets: [{ id: 'bosque-dorado-01', fuente: require('../../../../assets/ilustraciones/senderos/biomas/arboles/bosque-dorado-01.png'), nombre: 'Bosque dorado' }],
    densidadDecoracion: 0.68,
    promptBase: `${guiaIsometrica}, warm golden-yellow forest biome, autumn foliage, organized trail markers`,
  },
  habitos: {
    assets: [{ id: 'arce-01', fuente: require('../../../../assets/ilustraciones/senderos/biomas/arboles/arce-01.png'), nombre: 'Arce rojo' }],
    densidadDecoracion: 0.7,
    promptBase: `${guiaIsometrica}, vivid red maple forest biome, falling leaves, disciplined autumn garden`,
  },
  relaciones: {
    assets: [
      { id: 'cerezo-01', fuente: require('../../../../assets/ilustraciones/senderos/biomas/arboles/cerezo-01.png'), nombre: 'Cerezo japonés' },
      { id: 'cerezo-02', fuente: require('../../../../assets/ilustraciones/senderos/biomas/arboles/cerezo-02.png'), nombre: 'Cerezo japonés alterno' },
    ],
    densidadDecoracion: 0.68,
    promptBase: `${guiaIsometrica}, Japanese cherry blossom biome, soft pink sakura petals, elegant garden path`,
  },
  finanzas: {
    assets: [{ id: 'bosque-calido-01', fuente: require('../../../../assets/ilustraciones/senderos/biomas/arboles/bosque-calido-01.png'), nombre: 'Bosque cálido' }],
    densidadDecoracion: 0.64,
    promptBase: `${guiaIsometrica}, warm orange woodland biome, amber foliage, subtle wealth and crafted stone details`,
  },
  estudio: {
    assets: [{ id: 'sauce-ruinas-01', fuente: require('../../../../assets/ilustraciones/senderos/biomas/arboles/sauce-ruinas-01.png'), nombre: 'Sauce y ruinas' }],
    densidadDecoracion: 0.72,
    promptBase: `${guiaIsometrica}, mystical purple biome, weeping willow, ancient carved stones and subtle ruins`,
  },
};

export function obtenerAssetBioma(categoriaId: CategoriaMapaId, id: string) {
  return registroBiomas[categoriaId].assets.find((asset) => asset.id === id) ?? null;
}
