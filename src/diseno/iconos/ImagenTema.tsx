import { useState } from 'react';
import { Image, View, type ImageResizeMode, type ImageSourcePropType, type ImageStyle, type StyleProp, type ViewStyle } from 'react-native';

import { MasterChanger } from '../componentes/MasterChanger';
import { useTonoMaster } from '../tema/MasterColorContext';

type ImagenTemaProps = {
  fuente: ImageSourcePropType;
  /** Tamaño y posición: puede ser en porcentaje (se mide el contenedor). */
  estilo?: StyleProp<ViewStyle>;
  /** Si la imagen tiene algo verde que deba seguir el tema. Una piedra sin musgo va en `false` y se queda como imagen normal. */
  conVerde?: boolean;
  resizeMode?: Extract<ImageResizeMode, 'contain' | 'cover'>;
};

/**
 * Ilustración (pasto, roca con musgo, decoración) que sigue el tema: rota SOLO sus píxeles verdes al matiz del
 * paquete activo — el musgo de una roca cambia y la piedra crema no — igual de vivo (ver tinteHsv.ts).
 * En Esmeralda, o con `conVerde={false}`, es un <Image> normal, sin Skia.
 */
export function ImagenTema({ conVerde = true, estilo, fuente, resizeMode = 'contain' }: ImagenTemaProps) {
  const tono = useTonoMaster();
  const [caja, setCaja] = useState<{ alto: number; ancho: number } | null>(null);

  if (!conVerde || tono.deltaHueIcono === undefined) {
    return <Image resizeMode={resizeMode} source={fuente} style={estilo as StyleProp<ImageStyle>} />;
  }
  return (
    <View onLayout={({ nativeEvent: { layout } }) => setCaja({ alto: layout.height, ancho: layout.width })} style={estilo}>
      {caja && caja.ancho > 0 && caja.alto > 0 && (
        <MasterChanger
          alto={caja.alto}
          ancho={caja.ancho}
          deltaTema={tono.deltaHueIcono}
          fit={resizeMode}
          fuente={fuente}
          saturacion={tono.icono.saturacion}
          soloPixelesVerdes
          valorTema={tono.icono.valor}
        />
      )}
    </View>
  );
}
