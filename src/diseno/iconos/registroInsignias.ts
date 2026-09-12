import type { ImageSourcePropType } from 'react-native';

// 7 insignias (moradas en el archivo original) que representan visualmente el
// nivel 1-7 de un hábito. MasterChanger las recolorea al vuelo — no hay una
// copia verde separada, se detecta el hue morado y se rota al destino pedido.
const FUENTES_INSIGNIAS: Record<number, ImageSourcePropType> = {
  1: require('../../../assets/icons/insignias/nivel1.png'),
  2: require('../../../assets/icons/insignias/nivel2.png'),
  3: require('../../../assets/icons/insignias/nivel3.png'),
  4: require('../../../assets/icons/insignias/nivel4.png'),
  5: require('../../../assets/icons/insignias/nivel5.png'),
  6: require('../../../assets/icons/insignias/nivel6.png'),
  7: require('../../../assets/icons/insignias/nivel7.png'),
};

export const NIVEL_MAXIMO_INSIGNIA = 7;

export function fuenteInsignia(nivel: number): ImageSourcePropType {
  const acotado = Math.min(NIVEL_MAXIMO_INSIGNIA, Math.max(1, Math.round(nivel)));
  return FUENTES_INSIGNIAS[acotado];
}
