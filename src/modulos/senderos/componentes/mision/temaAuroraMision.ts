import { colorMasterMasCercano } from '../../../../diseno/componentes/MasterChanger';
import type { TemaAurora } from '../../../hoy/componentes/AuroraBoreal';

// No hay ColorMaster→TemaAurora exacto (7 buckets contra 5 temas
// disponibles) — se toma el tema más cercano en vez de agregar un tema
// nuevo sólo para estas pantallas.
const TEMA_POR_COLOR_MASTER: Record<number, TemaAurora> = {
  1: 'grafito', 2: 'verde', 3: 'amarillo', 4: 'rojo', 5: 'rojo', 6: 'morado', 7: 'morado',
};

export function temaAuroraDesdeColor(color: string): TemaAurora {
  return TEMA_POR_COLOR_MASTER[colorMasterMasCercano(color)];
}
