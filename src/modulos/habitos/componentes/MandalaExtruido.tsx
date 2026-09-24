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
// Cuánto se recuesta la mandala hacia atrás (rotateX), sólo ella, no el
// mapa: 0 = de pie mirando a la cámara; más grados = se ve más desde arriba.
export const INCLINACION_MANDALA = -30;
// Proporción de blanco en la cara: 0.7 = pastel claro del color del paquete.
export const BLANCO_PASTEL_MANDALA = 0.7;
// Filo blanco de la cara, en unidades del lienzo (≈0,7 px en el pedestal).
const FILO_MANDALA = 4;

function canales(color: string) {
  const hex = color.replace('#', '');
  if (hex.length < 6) return null;
  return [0, 2, 4].map((inicio) => parseInt(hex.slice(inicio, inicio + 2), 16));
}

function aHex(valores: number[]) {
  return `#${valores.map((v) => Math.round(Math.min(255, Math.max(0, v))).toString(16).padStart(2, '0')).join('')}`;
}

// Cara pastel (el color del paquete mezclado con blanco) y canto en el color
// pleno, como una joya: suave de frente, intensa de costado — el canto es lo
// que la despega de un mapa que ya es una versión clara del mismo color.
export function coloresMandala(color: string) {
  const rgb = canales(color);
  if (!rgb) return { canto: color, cara: color, filo: '#FFFFFF' };
  return {
    canto: aHex(rgb.map((v) => v * 0.88)),
    cara: aHex(rgb.map((v) => v + (255 - v) * BLANCO_PASTEL_MANDALA)),
    filo: '#FFFFFF',
  };
}

type MandalaExtruidoProps = {
  /** Color pleno del paquete; la cara pastel y el canto se derivan de él. */
  color: string;
  trazos: TrazoMandala[];
  tamano: number;
  /** Giro sobre el eje vertical, en grados. */
  giro: SharedValue<number>;
  /** 0 = lámina plana, 1 = grosor completo. Sin él, siempre grosor completo. */
  relieve?: SharedValue<number>;
  /** 0 = de pie, 1 = recostada INCLINACION_MANDALA grados. Sin él, recostada. */
  inclinacion?: SharedValue<number>;
  /** Láminas apiladas que forman el canto; menos en el mapa, más en primer plano. */
  capas?: number;
};

// React Native no apila vistas en profundidad real, así que el volumen se
// simula como una moneda: la misma mandala repetida en láminas, cada una a
// su profundidad z. Girar `giro` sobre Y y recostar `inclinacion` sobre X
// lleva una lámina a profundidad z a (z·sinθ, −z·cosθ·sinφ) en pantalla
// (misma matriz que rotateY/rotateX), y así aparece el canto. Las láminas
// exteriores llevan la cara pastel y las interiores el color pleno.
export function MandalaExtruido({ capas = 6, color, giro, inclinacion, relieve, tamano, trazos }: MandalaExtruidoProps) {
  const caminos = useMemo(() => construirCaminosMandala(trazos, ANCHO_CINTA_MANDALA), [trazos]);
  const paleta = useMemo(() => coloresMandala(color), [color]);
  const grosor = tamano * 0.08;
  const viewBox = `${-LADO_LIENZO_MANDALA / 2} ${-LADO_LIENZO_MANDALA / 2} ${LADO_LIENZO_MANDALA} ${LADO_LIENZO_MANDALA}`;

  return (
    <View pointerEvents="none" style={{ height: tamano, width: tamano }}>
      {Array.from({ length: capas }, (_, indice) => {
        const exterior = indice === 0 || indice === capas - 1;
        return (
          <CapaMandala
            caminos={caminos}
            color={exterior ? paleta.cara : paleta.canto}
            filo={indice === capas - 1 ? paleta.filo : undefined}
            giro={giro}
            grosor={grosor}
            inclinacion={inclinacion}
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

function CapaMandala({ caminos, color, filo, giro, grosor, inclinacion, profundidad, relieve, tamano, viewBox }: {
  caminos: string[];
  color: string;
  filo?: string;
  giro: SharedValue<number>;
  grosor: number;
  inclinacion?: SharedValue<number>;
  profundidad: number;
  relieve?: SharedValue<number>;
  tamano: number;
  viewBox: string;
}) {
  const estilo = useAnimatedStyle(() => {
    const z = profundidad * grosor * (relieve ? relieve.value : 1);
    const theta = (giro.value * Math.PI) / 180;
    const phi = INCLINACION_MANDALA * (inclinacion ? inclinacion.value : 1);
    return {
      transform: [
        { perspective: tamano * 6 },
        { translateX: z * Math.sin(theta) },
        { translateY: -z * Math.cos(theta) * Math.sin((phi * Math.PI) / 180) },
        { rotateX: `${phi}deg` },
        { rotateY: `${giro.value}deg` },
      ],
    };
  });

  return (
    <Animated.View style={[StyleSheet.absoluteFill, estilo]}>
      <Svg height={tamano} viewBox={viewBox} width={tamano}>
        {caminos.map((d, indice) => (d
          ? <Path d={d} fill={color} key={indice} stroke={filo} strokeLinejoin="round" strokeOpacity={0.75} strokeWidth={filo ? FILO_MANDALA : 0} />
          : null))}
      </Svg>
    </Animated.View>
  );
}
