import type { ReactNode } from 'react';
import { useEffect, useRef } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withSpring, withTiming } from 'react-native-reanimated';

import { Texto } from '../componentes/Texto';
import { useTonoMaster } from '../tema/MasterColorContext';
import { MasterGlass } from './MasterGlass';

type MasterChipProps = {
  activo?: boolean;
  icono?: ReactNode;
  onPress?: () => void;
  texto: string;
};

// Chip seleccionable ultra-ligero:
// – El fondo verde es un View SIEMPRE montado con opacity animada (0 ↔ 1).
// – La opacidad la maneja el compositor nativo sin ningún cálculo de color.
// – Sin SVG, sin interpolateColor, sin Math.sin — cero carga JS.
export function MasterChip({ activo = false, icono, onPress, texto }: MasterChipProps) {
  const opacidadFondo = useSharedValue(activo ? 1 : 0);
  const escala        = useSharedValue(1);
  const primerMontaje = useRef(true);
  const tono = useTonoMaster();

  useEffect(() => {
    if (primerMontaje.current) { primerMontaje.current = false; return; }
    opacidadFondo.value = withTiming(activo ? 1 : 0, { duration: 220, easing: Easing.out(Easing.quad) });
  }, [activo, opacidadFondo]);

  const estiloFondo = useAnimatedStyle(() => ({ opacity: opacidadFondo.value }));
  const estiloEscala = useAnimatedStyle(() => ({ transform: [{ scale: escala.value }] }));

  return (
    <Pressable
      unstable_pressDelay={120}
      onPress={onPress}
      onPressIn={() => { if (onPress) escala.value = withTiming(0.95, { duration: 80 }); }}
      onPressOut={() => { if (onPress) escala.value = withTiming(1, { duration: 120 }); }}
    >
      <Animated.View style={estiloEscala}>
        <MasterGlass style={mc.raiz}>
          {/* Fondo verde absoluto, siempre montado, solo cambia opacity */}
          <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, mc.fondoVerde, { backgroundColor: tono.chipActivo }, estiloFondo]} />
          <View style={mc.fila}>
            {icono}
            <Texto style={[mc.texto, { color: tono.chipTexto }, activo && mc.textoActivo]}>{texto}</Texto>
          </View>
        </MasterGlass>
      </Animated.View>
    </Pressable>
  );
}

const mc = StyleSheet.create({
  raiz:        { borderRadius: 12, overflow: 'hidden' },
  fondoVerde:  { borderRadius: 12 },
  fila:        { alignItems: 'center', flexDirection: 'row', gap: 8, paddingHorizontal: 12, paddingVertical: 8 },
  texto:       { fontFamily: 'Montserrat-Bold', fontSize: 13 },
  textoActivo: { color: '#FFFFFF' },
});
