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
// Distancia de cámara relativa al tamaño: más baja = el borde que se acerca
// crece más, y el sentido del giro se lee sin ambigüedad.
const PERSPECTIVA_RELATIVA = 2.6;
// Luz fija arriba a la izquierda, hacia la cámara (normalizada): la cara se
// aclara al girar hacia ella y se apaga al alejarse, así el giro tiene un
// sentido visible y no "rebota" como la bailarina de la ilusión óptica.
const LUZ = { x: -0.5, z: 0.866 };
const SOMBRA_MAXIMA = 0.42;

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
  if (!rgb) return { canto: color, cara: color, filo: '#FFFFFF', reverso: color };
  return {
    canto: aHex(rgb.map((v) => v * 0.88)),
    cara: aHex(rgb.map((v) => v + (255 - v) * BLANCO_PASTEL_MANDALA)),
    // El reverso, un pastel más profundo y sin filo: se distingue de frente.
    reverso: aHex(rgb.map((v) => v + (255 - v) * (BLANCO_PASTEL_MANDALA - 0.18))),
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
// (misma matriz que rotateY/rotateX), y así aparece el canto. La cara lleva
// el pastel con filo blanco, el reverso un pastel más profundo, y las
// láminas interiores el color pleno.
export function MandalaExtruido({ capas = 6, color, giro, inclinacion, relieve, tamano, trazos }: MandalaExtruidoProps) {
  const caminos = useMemo(() => construirCaminosMandala(trazos, ANCHO_CINTA_MANDALA), [trazos]);
  const paleta = useMemo(() => coloresMandala(color), [color]);
  const grosor = tamano * 0.08;
  const viewBox = `${-LADO_LIENZO_MANDALA / 2} ${-LADO_LIENZO_MANDALA / 2} ${LADO_LIENZO_MANDALA} ${LADO_LIENZO_MANDALA}`;

  return (
    <View pointerEvents="none" style={{ height: tamano, width: tamano }}>
      {Array.from({ length: capas }, (_, indice) => {
        const frente = indice === capas - 1;
        const reverso = indice === 0 && capas > 1;
        return (
          <CapaMandala
            capas={capas}
            caminos={caminos}
            cara={frente ? 1 : reverso ? -1 : 0}
            color={frente ? paleta.cara : reverso ? paleta.reverso : paleta.canto}
            filo={frente ? paleta.filo : undefined}
            indice={indice}
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

function CapaMandala({ capas, caminos, cara, color, filo, giro, grosor, inclinacion, indice, profundidad, relieve, tamano, viewBox }: {
  capas: number;
  caminos: string[];
  /** 1 = cara frontal, -1 = reverso, 0 = lámina interior del canto. */
  cara: number;
  color: string;
  filo?: string;
  giro: SharedValue<number>;
  grosor: number;
  inclinacion?: SharedValue<number>;
  indice: number;
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
      // De espaldas, el orden de pintado se invierte: la lámina más cercana
      // a la cámara siempre queda encima (si no, la profundidad contradice
      // al giro y parece cambiar de sentido a mitad de vuelta).
      zIndex: Math.cos(theta) >= 0 ? indice : capas - 1 - indice,
      transform: [
        { perspective: tamano * PERSPECTIVA_RELATIVA },
        { translateX: z * Math.sin(theta) },
        { translateY: -z * Math.cos(theta) * Math.sin((phi * Math.PI) / 180) },
        { rotateX: `${phi}deg` },
        { rotateY: `${giro.value}deg` },
      ],
    };
  });

  // Sombreado de la cara según su normal girada (sinθ, cosθ)·cara frente a
  // la luz: sólo las dos caras exteriores, el canto ya es el color pleno.
  const estiloSombra = useAnimatedStyle(() => {
    const theta = (giro.value * Math.PI) / 180;
    const luz = cara * (Math.sin(theta) * LUZ.x + Math.cos(theta) * LUZ.z);
    return { opacity: SOMBRA_MAXIMA * (1 - Math.min(1, Math.max(0, luz))) };
  });

  return (
    <Animated.View style={[StyleSheet.absoluteFill, estilo]}>
      <Svg height={tamano} viewBox={viewBox} width={tamano}>
        {caminos.map((d, i) => (d
          ? <Path d={d} fill={color} key={i} stroke={filo} strokeLinejoin="round" strokeOpacity={0.75} strokeWidth={filo ? FILO_MANDALA : 0} />
          : null))}
      </Svg>
      {cara !== 0 && (
        <Animated.View style={[StyleSheet.absoluteFill, estiloSombra]}>
          <Svg height={tamano} viewBox={viewBox} width={tamano}>
            {caminos.map((d, i) => (d ? <Path d={d} fill="#000000" key={i} /> : null))}
          </Svg>
        </Animated.View>
      )}
    </Animated.View>
  );
}
