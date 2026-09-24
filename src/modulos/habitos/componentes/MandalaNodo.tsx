import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
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
  const anchoBase = tamano * 0.24;
  const caminos = construirCaminosMandala(puntos, anchoBase);
  const opacidad = estado === 'creada' ? 1 : 0.55;

  return (
    <View style={{ height: tamano, width: tamano }}>
      <Canvas pointerEvents="none" style={StyleSheet.absoluteFill}>
        <Group opacity={0.4 * opacidad}>
          <Oval color={color} height={tamano * 0.62} width={tamano * 0.62} x={tamano * 0.19} y={tamano * 0.19}>
            <BlurMask blur={Math.max(2, tamano * 0.09)} style="normal" />
          </Oval>
        </Group>
      </Canvas>
      <Animated.View style={[StyleSheet.absoluteFill, estiloRespiro, { opacity: opacidad }]}>
        <Svg height={tamano} viewBox={`${-VIEWBOX / 2} ${-VIEWBOX / 2} ${VIEWBOX} ${VIEWBOX}`} width={tamano}>
          {caminos.map((d, indice) => (d ? <Path d={d} fill={color} fillOpacity={0.96} key={indice} /> : null))}
        </Svg>
      </Animated.View>
    </View>
  );
}
