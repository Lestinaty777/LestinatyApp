import { PropsWithChildren } from 'react';
import { BlurView, BlurViewProps } from 'expo-blur';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';

type RecuadroGlassProps = PropsWithChildren<{
  blur?: boolean;
  intensity?: number;
  modo?: 'light' | 'dark';
  style?: StyleProp<ViewStyle>;
  tint?: BlurViewProps['tint'];
}>;

export function RecuadroGlass({
  blur = false,
  children,
  intensity,
  modo = 'light',
  style,
  tint,
}: RecuadroGlassProps) {
  const esDark = modo === 'dark';

  // Valores por defecto según modo
  const intensidadFinal = intensity ?? (esDark ? 18 : 24);
  const tintFinal = tint ?? (esDark ? 'dark' : 'light');
  const estilosModo = esDark ? styles.baseDark : styles.baseLight;
  const tinteColor = esDark
    ? 'rgba(10, 12, 28, 0.55)'
    : 'rgba(255, 255, 255, 0.18)';
  const brilloColor = esDark
    ? 'rgba(255, 255, 255, 0.07)'
    : 'rgba(255, 255, 255, 0.5)';

  if (blur) {
    return (
      <BlurView intensity={intensidadFinal} tint={tintFinal} style={[styles.base, estilosModo, style]}>
        <View pointerEvents="none" style={[styles.tinteBlur, { backgroundColor: tinteColor }]} />
        <View pointerEvents="none" style={[styles.sombraInterna, { borderColor: brilloColor }]} />
        {children}
      </BlurView>
    );
  }

  return (
    <View style={[styles.base, estilosModo, style]}>
      <View pointerEvents="none" style={[styles.sombraInterna, { borderColor: brilloColor }]} />
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: 4,
    overflow: 'hidden',
  },
  // Light: fondo blanco translúcido
  baseLight: {
    backgroundColor: 'rgba(255, 255, 255, 0.35)',
  },
  // Dark: fondo azul noche muy translúcido con saturación mínima
  baseDark: {
    backgroundColor: 'rgba(21, 24, 41, 0.72)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.07)',
  },
  tinteBlur: {
    bottom: 0,
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
  },
  sombraInterna: {
    borderTopWidth: 0.8,
    bottom: 0,
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
  },
});
