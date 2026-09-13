import { useEffect } from 'react';
import type { DimensionValue, StyleProp, ViewStyle } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';

type SkeletonProps = {
  alto?: number;
  ancho?: DimensionValue;
  radio?: number;
  style?: StyleProp<ViewStyle>;
};

// Placeholder pulsante para contenido que todavía depende de una consulta real
// (no para íconos/imágenes locales — esas ya están empacadas, no tienen
// latencia que esconder). El pulso corre en el hilo de UI (reanimated), no en JS.
export function Skeleton({ alto = 16, ancho = '100%', radio = 8, style }: SkeletonProps) {
  const opacidad = useSharedValue(0.35);

  useEffect(() => {
    opacidad.value = withRepeat(withTiming(0.85, { duration: 650, easing: Easing.inOut(Easing.ease) }), -1, true);
  }, [opacidad]);

  const estiloAnimado = useAnimatedStyle(() => ({ opacity: opacidad.value }));

  return <Animated.View style={[{ backgroundColor: '#DDD6E9', borderRadius: radio, height: alto, width: ancho }, estiloAnimado, style]} />;
}
