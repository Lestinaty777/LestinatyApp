import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { type SharedValue, useAnimatedStyle } from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';

import { construirCaminosMandala } from '../mandalaGeometria';
import type { TrazoMandala } from '../mandalaNodo.tipos';

// Mismo espacio de coordenadas que el lienzo donde se traza (radio ~150,
// centrado en 0,0) y el mismo ancho de cinta: así la mandala trazada y la
// extruida son idénticas en el instante del relevo, sin salto visual.
export const LADO_LIENZO_MANDALA = 320;
export const RADIO_TRAZO_MANDALA = 150;
export const ANCHO_CINTA_MANDALA = LADO_LIENZO_MANDALA * 0.06;
// Pose de reposo: tres cuartos de giro, para que el grosor se lea aun quieta.
export const ANGULO_REPOSO_MANDALA = -26;

function oscurecer(color: string, factor: number) {
  const hex = color.replace('#', '');
  if (hex.length < 6) return color;
  const canal = (inicio: number) => Math.round(parseInt(hex.slice(inicio, inicio + 2), 16) * factor).toString(16).padStart(2, '0');
  return `#${canal(0)}${canal(2)}${canal(4)}`;
}

type MandalaExtruidoProps = {
  color: string;
  trazos: TrazoMandala[];
  tamano: number;
  /** Giro sobre el eje vertical, en grados. */
  giro: SharedValue<number>;
  /** 0 = lámina plana, 1 = grosor completo. Sin él, siempre grosor completo. */
  relieve?: SharedValue<number>;
  /** Láminas apiladas que forman el canto; menos en el mapa, más en primer plano. */
  capas?: number;
};

// React Native no apila vistas en profundidad real, así que el volumen se
// simula como una moneda: la misma mandala repetida en láminas, cada una a
// su profundidad z. Al girar `giro` grados sobre Y, una lámina a profundidad
// z se desplaza z·sin(giro) en pantalla (misma matriz que rotateY), y el
// canto aparece de costado. Las láminas exteriores llevan el color pleno y
// las interiores uno oscurecido, así la cara visible siempre es la clara.
export function MandalaExtruido({ capas = 6, color, giro, relieve, tamano, trazos }: MandalaExtruidoProps) {
  const caminos = useMemo(() => construirCaminosMandala(trazos, ANCHO_CINTA_MANDALA), [trazos]);
  const colorCanto = useMemo(() => oscurecer(color, 0.62), [color]);
  const grosor = tamano * 0.08;
  const viewBox = `${-LADO_LIENZO_MANDALA / 2} ${-LADO_LIENZO_MANDALA / 2} ${LADO_LIENZO_MANDALA} ${LADO_LIENZO_MANDALA}`;

  return (
    <View pointerEvents="none" style={{ height: tamano, width: tamano }}>
      {Array.from({ length: capas }, (_, indice) => {
        const exterior = indice === 0 || indice === capas - 1;
        return (
          <CapaMandala
            caminos={caminos}
            color={exterior ? color : colorCanto}
            giro={giro}
            grosor={grosor}
            key={indice}
            profundidad={capas > 1 ? indice / (capas - 1) - 0.5 : 0}
            relieve={relieve}
            tamano={tamano}
            viewBox={viewBox}
          />
        );
      })}
    </View>
  );
}

function CapaMandala({ caminos, color, giro, grosor, profundidad, relieve, tamano, viewBox }: {
  caminos: string[];
  color: string;
  giro: SharedValue<number>;
  grosor: number;
  profundidad: number;
  relieve?: SharedValue<number>;
  tamano: number;
  viewBox: string;
}) {
  const estilo = useAnimatedStyle(() => {
    const z = profundidad * grosor * (relieve ? relieve.value : 1);
    return {
      transform: [
        { perspective: tamano * 6 },
        { translateX: z * Math.sin((giro.value * Math.PI) / 180) },
        { rotateY: `${giro.value}deg` },
      ],
    };
  });

  return (
    <Animated.View style={[StyleSheet.absoluteFill, estilo]}>
      <Svg height={tamano} viewBox={viewBox} width={tamano}>
        {caminos.map((d, indice) => (d ? <Path d={d} fill={color} key={indice} /> : null))}
      </Svg>
    </Animated.View>
  );
}
