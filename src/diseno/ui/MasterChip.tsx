import type { ReactNode } from 'react';
import { useEffect, useRef, useState } from 'react';
import { LayoutChangeEvent, Pressable, StyleSheet, View } from 'react-native';
import Animated, { Easing, FadeIn, FadeOut, cancelAnimation, interpolateColor, runOnJS, useAnimatedProps, useAnimatedStyle, useSharedValue, withSpring, withTiming, type SharedValue } from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';

import { Texto } from '../componentes/Texto';
import { MasterGlass } from './MasterGlass';

type MasterChipProps = {
  activo?: boolean;
  icono?: ReactNode;
  onPress: () => void;
  texto: string;
};

const AnimatedPath = Animated.createAnimatedComponent(Path);
const COLOR_INACTIVO = '#EAF8EB';
const COLOR_ACTIVO = '#2F7D52';
const SEGMENTOS_OLA = 6;

// Relleno animado de olas: sube/baja un nivel de agua con cresta senoidal en
// movimiento breve, y el color del agua pasa de menta claro a verde "mastery"
// a medida que progreso va de 0 a 1. La fase hace un solo recorrido durante
// la transición: no queda ningún SVG recalculando su path por frame después.
function RellenoOlas({ animando, progreso }: { animando: boolean; progreso: SharedValue<number> }) {
  const ancho = useSharedValue(0);
  const alto  = useSharedValue(0);
  const fase  = useSharedValue(0);

  useEffect(() => {
    if (animando) {
      fase.value = 0;
      fase.value = withTiming(Math.PI * 2, { duration: 600, easing: Easing.linear });
    } else {
      cancelAnimation(fase);
    }
  }, [animando, fase]);

  const medir = ({ nativeEvent: { layout } }: LayoutChangeEvent) => {
    ancho.value = layout.width;
    alto.value  = layout.height;
  };

  const propsAnimadas = useAnimatedProps(() => {
    const h = Math.max(1, alto.value);
    const w = Math.max(1, ancho.value);
    const nivel = h * (1 - progreso.value);
    const amplitud = 3 * Math.sin(progreso.value * Math.PI);
    const paso = w / SEGMENTOS_OLA;
    let d = `M0 ${nivel.toFixed(1)}`;
    for (let i = 1; i <= SEGMENTOS_OLA; i++) {
      const x = paso * i;
      const y = nivel + Math.sin(fase.value + i * 1.25) * amplitud;
      d += ` L${x.toFixed(1)} ${y.toFixed(1)}`;
    }
    d += ` L${w.toFixed(1)} ${h.toFixed(1)} L0 ${h.toFixed(1)} Z`;
    return { d, fill: interpolateColor(progreso.value, [0, 1], [COLOR_INACTIVO, COLOR_ACTIVO]) };
  });

  return (
    <View onLayout={medir} pointerEvents="none" style={StyleSheet.absoluteFill}>
      <Svg height="100%" width="100%">
        <AnimatedPath animatedProps={propsAnimadas} />
      </Svg>
    </View>
  );
}

// Chip glass para mostrar opciones breves y seleccionables (p. ej. Todos /
// Mañana / Tarde / Noche) — fondo MasterGlass + una ola breve que acompaña
// la transición de color al pasar de inactivo a "mastery".
export function MasterChip({ activo = false, icono, onPress, texto }: MasterChipProps) {
  const progreso = useSharedValue(activo ? 1 : 0);
  // Mientras hay transición en curso se ve la ola; en cuanto se asienta, la
  // ola se reemplaza por el MasterGlass con mastery real (su degradado propio,
  // no el verde plano de la ola) — así el estado final queda "de verdad".
  const [asentado, setAsentado] = useState(true);
  const primerMontaje = useRef(true);
  const escala = useSharedValue(1);
  const estiloRebote = useAnimatedStyle(() => ({ transform: [{ scale: escala.value }] }));

  useEffect(() => {
    if (primerMontaje.current) { primerMontaje.current = false; return; }
    setAsentado(false);
    progreso.value = withTiming(activo ? 1 : 0, { duration: 400, easing: Easing.out(Easing.cubic) }, (terminado) => {
      if (terminado) runOnJS(setAsentado)(true);
    });
  }, [activo, progreso]);

  return (
    <Pressable
      onPress={onPress}
      onPressIn={() => { escala.value = withTiming(0.93, { duration: 90 }); }}
      onPressOut={() => { escala.value = withSpring(1, { damping: 9, stiffness: 300 }); }}
    >
      <Animated.View style={estiloRebote}>
        <MasterGlass style={mc.raiz}>
          <View style={mc.recorte}>
            {/* La ola queda siempre montada (nunca se desmonta) para no perder su tamaño/fase medidos —
                eso es lo que evita el salto/corte al des-asentarse. El overlay "mastery" real solo se
                superpone encima, con fade propio, cuando el chip queda asentado y activo. */}
            <RellenoOlas animando={!asentado} progreso={progreso} />
            {asentado && activo && (
              <Animated.View entering={FadeIn.duration(240)} exiting={FadeOut.duration(240)} style={StyleSheet.absoluteFill}>
                <MasterGlass mastery style={StyleSheet.absoluteFill} />
              </Animated.View>
            )}
            <View style={mc.fila}>
              {icono}
              <Texto style={[mc.texto, activo && mc.textoActivo]}>{texto}</Texto>
            </View>
          </View>
        </MasterGlass>
      </Animated.View>
    </Pressable>
  );
}

const mc = StyleSheet.create({
  raiz: { borderRadius: 12 },
  // La ola se dibuja como un rectángulo (0,0 a ancho,alto) a propósito — este
  // recorte propio (independiente del overflow de MasterGlass) es lo que la
  // deja con forma de píldora en vez de cuadrada.
  recorte: { borderRadius: 12, overflow: 'hidden' },
  fila: { alignItems: 'center', flexDirection: 'row', gap: 8, paddingHorizontal: 12, paddingVertical: 8 },
  texto: { color: '#4A7F5D', fontFamily: 'Montserrat-Bold', fontSize: 13 },
  textoActivo: { color: '#FFFFFF' },
});
