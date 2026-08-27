import { ImageSourcePropType } from 'react-native';

import { colores, crearPaletaBioma, PaletaBioma } from '../fundamentos/colores';

export type BiomaVisual = {
  LightBg: ImageSourcePropType;
  DarkBg: ImageSourcePropType;
  MasterColor: string;
  Paleta: PaletaBioma;
};

function crearBioma({
  LightBg,
  DarkBg,
  MasterColor,
}: {
  LightBg: ImageSourcePropType;
  DarkBg: ImageSourcePropType;
  MasterColor: string;
}): BiomaVisual {
  return {
    LightBg,
    DarkBg,
    MasterColor,
    Paleta: crearPaletaBioma(MasterColor),
  };
}

export const biomas = {
  inicio: crearBioma({
    LightBg: require('../../../assets/ilustraciones/inicio.png'),
    DarkBg: require('../../../assets/ilustraciones/inicio.png'),
    MasterColor: colores.primario,
  }),
};
