import type { ImageSourcePropType } from 'react-native';

import { obtenerPaqueteVisualHabito } from './paqueteVisual';
import { resolverPaqueteHabito } from './paqueteHabito';
import { obtenerAssetsPaquete } from '../senderos/algoritmo/registroPaquetesArbol';

const ETAPAS_SIETE: Record<string, ImageSourcePropType> = {
  abyss: require('../../../assets/ilustraciones/senderos/biomas/paquetes/Abyss/etapa7.png'),
  amber: require('../../../assets/ilustraciones/senderos/biomas/paquetes/Amber/etapa7.png'),
  celesthia: require('../../../assets/ilustraciones/senderos/biomas/paquetes/Celesthia/etapa7.png'),
  esmeralda: require('../../../assets/ilustraciones/senderos/biomas/paquetes/Esmeralda/etapa7.png'),
  golden: require('../../../assets/ilustraciones/senderos/biomas/paquetes/Golden/etapa7.png'),
  ignate: require('../../../assets/ilustraciones/senderos/biomas/paquetes/Ignate/etapa7.png'),
  lightmoon: require('../../../assets/ilustraciones/senderos/biomas/paquetes/LightMoon/etapa7.png'),
  mathist: require('../../../assets/ilustraciones/senderos/biomas/paquetes/Mathist/etapa7.png'),
  nevalhi: require('../../../assets/ilustraciones/senderos/biomas/paquetes/Nevalhi/etapa7.png'),
  sakura: require('../../../assets/ilustraciones/senderos/biomas/paquetes/Sakura/etapa7.png'),
  valvery: require('../../../assets/ilustraciones/senderos/biomas/paquetes/Valvery/etapa7.png'),
  aurelia: require('../../../assets/ilustraciones/senderos/biomas/paquetes/aurelia/etapa7.png'),
  diamante: require('../../../assets/ilustraciones/senderos/biomas/paquetes/diamante/etapa7.png'),
  crimsonmoon: require('../../../assets/ilustraciones/senderos/biomas/paquetes/unicos/CrimsonMoon/etapa7.png'),
  eclipse: require('../../../assets/ilustraciones/senderos/biomas/paquetes/unicos/Eclipse/etapa7.png'),
  moon: require('../../../assets/ilustraciones/senderos/biomas/paquetes/unicos/Moon/etapa7.png'),
  vida: require('../../../assets/ilustraciones/senderos/biomas/paquetes/unicos/Vida/etapa7.png'),
};

export function obtenerEtapaSietePaquete(paqueteId?: string | null): ImageSourcePropType {
  const paquete = obtenerPaqueteVisualHabito(paqueteId);
  return ETAPAS_SIETE[paquete.id] ?? ETAPAS_SIETE.esmeralda;
}

export type AssetsPaqueteHabito = { arbolPrincipal: ImageSourcePropType; arbolSecundario: ImageSourcePropType; arbusto: ImageSourcePropType; base: ImageSourcePropType; flor: ImageSourcePropType };

export function obtenerAssetsPaqueteHabito(paqueteId?: string | null, nivel = 1): AssetsPaqueteHabito {
  const paquete = obtenerAssetsPaquete(resolverPaqueteHabito(paqueteId))!;
  const indice = Math.max(0, Math.min(6, Math.round(nivel) - 1));
  return { arbolPrincipal: paquete.etapas[indice], arbolSecundario: paquete.etapas[Math.max(0, indice - 1)], arbusto: paquete.arbusto, base: paquete.etapas[indice], flor: paquete.flor };
}
