import { PropsWithChildren, useState } from 'react';
import { BlurView, BlurViewProps } from 'expo-blur';
import { LayoutChangeEvent, StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';

type RecuadroGlassProps = PropsWithChildren<{
  blur?: boolean;
  degradado?: { inicio: string; fin: string };
  intensity?: number;
  modo?: 'light' | 'dark';
  style?: StyleProp<ViewStyle>;
  tint?: BlurViewProps['tint'];
}>;

export function RecuadroGlass({
  blur = false,
  children,
  degradado,
  intensity,
  modo = 'light',
  style,
  tint,
}: RecuadroGlassProps) {
  const [tamano, setTamano] = useState({ alto: 0, ancho: 0 });
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
  const medirContenedor = ({ nativeEvent: { layout } }: LayoutChangeEvent) => {
    if (layout.width !== tamano.ancho || layout.height !== tamano.alto) setTamano({ alto: layout.height, ancho: layout.width });
  };
  const capaDegradado = degradado && tamano.ancho > 0 && tamano.alto > 0 && <Svg pointerEvents="none" preserveAspectRatio="none" style={styles.degradado} width={tamano.ancho} height={tamano.alto}><Defs><LinearGradient id="recuadroGlassDiagonal" x1="0%" x2="100%" y1="0%" y2="100%"><Stop offset="0" stopColor={degradado.inicio}/><Stop offset="1" stopColor={degradado.fin}/></LinearGradient></Defs><Rect fill="url(#recuadroGlassDiagonal)" height={tamano.alto} width={tamano.ancho} x={0} y={0}/></Svg>;

  if (blur) {
    return (
      <BlurView intensity={intensidadFinal} onLayout={medirContenedor} tint={tintFinal} style={[styles.base, estilosModo, style]}>
        <View pointerEvents="none" style={[styles.tinteBlur, { backgroundColor: tinteColor }]} />
        {capaDegradado}
        <View pointerEvents="none" style={[styles.sombraInterna, { borderColor: brilloColor }]} />
        {children}
      </BlurView>
    );
  }

  return (
    <View onLayout={medirContenedor} style={[styles.base, estilosModo, style]}>
      {capaDegradado}
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
  degradado: { bottom: 0, left: 0, position: 'absolute', right: 0, top: 0 },
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
