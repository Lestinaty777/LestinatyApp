import type { ReactNode } from 'react';
import { useEffect, useRef, useState } from 'react';
import { LayoutChangeEvent, Pressable, StyleSheet, View } from 'react-native';
import Animated, { Easing, FadeIn, FadeOut, cancelAnimation, interpolateColor, runOnJS, useAnimatedProps, useAnimatedStyle, useSharedValue, withRepeat, withSpring, withTiming, type SharedValue } from 'react-native-reanimated';
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
// movimiento continuo, y el color del agua pasa de menta claro a verde
// "mastery" a medida que progreso va de 0 a 1. El bamboleo (fase) solo corre
// mientras `animando` es true — si quedara girando siempre (incluso asentado
// e invisible bajo el overlay), son 4 chips recalculando un path SVG entero
// cada frame para siempre, y eso es lo que trababa la pantalla.
function RellenoOlas({ animando, progreso }: { animando: boolean; progreso: SharedValue<number> }) {
  const [tamano, setTamano] = useState({ alto: 0, ancho: 0 });
  const fase = useSharedValue(0);

  useEffect(() => {
    if (animando) {
      fase.value = withRepeat(withTiming(Math.PI * 2, { duration: 2600, easing: Easing.linear }), -1, false);
    } else {
      cancelAnimation(fase);
    }
  }, [animando, fase]);

  const medir = ({ nativeEvent: { layout } }: LayoutChangeEvent) => setTamano({ alto: layout.height, ancho: layout.width });

  const propsAnimadas = useAnimatedProps(() => {
    const alto = Math.max(1, tamano.alto);
    const ancho = Math.max(1, tamano.ancho);
    const nivel = alto * (1 - progreso.value);
    // La cresta se nota más a media transición y se aplana en los extremos (lleno o vacío).
    const amplitud = 3.2 * Math.sin(progreso.value * Math.PI);
    let d = `M0 ${nivel.toFixed(0)}`;
    for (let indice = 1; indice <= SEGMENTOS_OLA; indice += 1) {
      const x = (ancho / SEGMENTOS_OLA) * indice;
      const y = nivel + Math.sin(fase.value + indice * 1.25) * amplitud;
      d += ` L${x.toFixed(0)} ${y.toFixed(0)}`;
    }
    d += ` L${ancho.toFixed(0)} ${alto.toFixed(0)} L0 ${alto.toFixed(0)} Z`;
    return { d, fill: interpolateColor(progreso.value, [0, 1], [COLOR_INACTIVO, COLOR_ACTIVO]) };
  });

  return (
    <View onLayout={medir} pointerEvents="none" style={StyleSheet.absoluteFill}>
      {tamano.ancho > 0 && tamano.alto > 0 && (
        <Svg height={tamano.alto} width={tamano.ancho}>
          <AnimatedPath animatedProps={propsAnimadas} />
        </Svg>
      )}
    </View>
  );
}

// Chip glass para mostrar opciones breves y seleccionables (p. ej. Todos /
// Mañana / Tarde / Noche) — fondo MasterGlass + una ola SVG que se rellena
// con una transición de color al pasar de inactivo a "mastery".
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
    progreso.value = withTiming(activo ? 1 : 0, { duration: 1500, easing: Easing.out(Easing.cubic) }, (terminado) => {
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
  raiz: { borderRadius: 20 },
  // La ola se dibuja como un rectángulo (0,0 a ancho,alto) a propósito — este
  // recorte propio (independiente del overflow de MasterGlass) es lo que la
  // deja con forma de píldora en vez de cuadrada.
  recorte: { borderRadius: 20, overflow: 'hidden' },
  fila: { alignItems: 'center', flexDirection: 'row', gap: 8, paddingHorizontal: 12, paddingVertical: 8 },
  texto: { color: '#4A7F5D', fontFamily: 'Montserrat-Bold', fontSize: 13 },
  textoActivo: { color: '#FFFFFF' },
});
