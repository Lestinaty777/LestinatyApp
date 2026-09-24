import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Path, G, Circle } from 'react-native-svg';
import Animated, { useAnimatedStyle, useSharedValue, withRepeat, withSequence, withTiming } from 'react-native-reanimated';
import { BlurMask, Canvas, Group, Oval } from '@shopify/react-native-skia';

import { construirCaminosMandala, trazoDesdeSemilla } from '../mandalaGeometria';
import type { EstadoMandala, TrazoMandala } from '../mandalaNodo.tipos';

// Coordenadas centradas en (0,0) — mismo espacio que el prototipo validado
// (radio de trazo hasta ~150). El tamaño en pantalla lo da `tamano` vía el
// viewBox del <Svg>, no hay que reescalar los puntos.
const RADIO_GEOMETRIA = 150;
const VIEWBOX = RADIO_GEOMETRIA * 2 + 20;

type MandalaNodoProps = {
  /** El color viene del snapshot del paquete (mandala_color) — nunca del tema global. */
  color: string;
  estado: EstadoMandala;
  /** Fallback reproducible mientras no hay trazos reales (pendiente, o aún no llegaron). */
  semilla: string;
  tamano?: number;
  trazos?: TrazoMandala[] | null;
  /** false para vistas históricas/miniaturas fuera de viewport — sin loop. */
  animado?: boolean;
};

// Mandala vectorial en el color saturado real del paquete (nunca blanco ni
// pastel) + halo del mismo color detrás (Skia, mismo patrón de blur que
// SombraSuelo/NodoCofreSendero en el mapa) + respiro lento vía Reanimated
// (mismo criterio que AnilloProgreso.tsx: un solo useSharedValue, sin
// animar los puntos del path).
export function MandalaNodo({ animado = true, color, estado, semilla, tamano = 72, trazos }: MandalaNodoProps) {
  const respiro = useSharedValue(0);

  useEffect(() => {
    if (!animado) { respiro.value = 0; return; }
    respiro.value = withRepeat(
      withSequence(withTiming(1, { duration: 2100 }), withTiming(0, { duration: 2100 })),
      -1,
      true,
    );
  }, [animado, respiro]);

  const estiloRespiro = useAnimatedStyle(() => ({ transform: [{ scale: 1 + respiro.value * 0.045 }] }));

  const puntos = trazos && trazos.length > 1 ? trazos : trazoDesdeSemilla(semilla, RADIO_GEOMETRIA * 0.75);
  // El ancho base del trazo DEBE ser relativo al espacio de coordenadas del VIEWBOX vectorial,
  // NO al `tamano` en pantalla. De lo contrario, al escalar el componente a gran tamaño,
  // los lazos se vuelven gigantes y se deforman. 13.6% del viewBox = ~43.5px lógicos.
  const anchoBase = VIEWBOX * 0.136; 
  const caminos = construirCaminosMandala(puntos, anchoBase);
  const opacidad = estado === 'creada' ? 1 : 0.55;

  const rView = VIEWBOX / 2;
  const rHalo = tamano * 0.48;

  return (
    <View style={{ height: tamano, width: tamano }}>
      {/* Halo del orbe (color del paquete, extendido) */}
      <Canvas pointerEvents="none" style={StyleSheet.absoluteFill}>
        <Group opacity={0.35 * opacidad}>
          <Oval color={color} height={rHalo} width={rHalo} x={(tamano - rHalo) / 2} y={(tamano - rHalo) / 2}>
            <BlurMask blur={Math.max(2, tamano * 0.12)} style="normal" />
          </Oval>
        </Group>
      </Canvas>
      <Animated.View style={[StyleSheet.absoluteFill, estiloRespiro, { opacity: opacidad }]}>
        <Svg height={tamano} viewBox={`${-VIEWBOX / 2} ${-VIEWBOX / 2} ${VIEWBOX} ${VIEWBOX}`} width={tamano}>
          
          {/* Fondo fantasma de la mandala (blanco tenue, como en el artefacto HTML) */}
          <G opacity={0.22}>
            {caminos.map((d, indice) => (d ? <Path d={d} fill="#FFFFFF" key={indice} /> : null))}
          </G>

          {/* Anillo del Orbe */}
          <Circle cx={0} cy={0} r={rView * 0.26} fill="none" stroke="#FFFFFF" strokeOpacity={0.7} strokeWidth={rView * 0.03} />
          
          {/* Núcleo del Orbe (Color del hábito) */}
          <Circle cx={0} cy={0} r={rView * 0.14} fill={color} />
          
        </Svg>
      </Animated.View>
    </View>
  );
}
