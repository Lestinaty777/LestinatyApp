import type { ReactNode } from 'react';
import { Insets, Pressable, StyleProp, ViewStyle } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring, withTiming } from 'react-native-reanimated';

import { hapticSeguro } from '../../nucleo/dispositivo/haptics';

type ReboteProps = {
  accessibilityLabel?: string;
  children: ReactNode;
  estilo?: StyleProp<ViewStyle>;
  hitSlop?: number | Insets;
  onPress?: () => void;
  overlay?: ReactNode;
};

// Envoltorio de rebote táctil compartido (antes duplicado en CrearHabitoWizard
// y WidgetRegistrarProgreso) — tap-scale + haptic, para usarse en cualquier
// elemento presionable que quiera sentirse "premium".
export function Rebote({ accessibilityLabel, children, estilo, hitSlop, onPress, overlay }: ReboteProps) {
  const escala = useSharedValue(1);
  const estiloAnimado = useAnimatedStyle(() => ({ transform: [{ scale: escala.value }] }));
  return (
    <Pressable
      accessibilityLabel={accessibilityLabel}
      hitSlop={hitSlop}
      onPress={() => { if (onPress) { hapticSeguro('seleccion'); onPress(); } }}
      onPressIn={() => { if (onPress) escala.value = withTiming(0.94, { duration: 90 }); }}
      onPressOut={() => { if (onPress) escala.value = withSpring(1, { damping: 9, stiffness: 260 }); }}
      style={estilo}
    >
      {/* overlay va fuera del envoltorio de escala (que se ajusta a su
          contenido) para que ancle al tamaño real del botón, no al del ícono. */}
      {overlay}
      <Animated.View style={estiloAnimado}>{children}</Animated.View>
    </Pressable>
  );
}
