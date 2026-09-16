import { useEffect } from 'react';
import { StyleProp, StyleSheet, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { cancelAnimation, Easing, useAnimatedStyle, useSharedValue, withDelay, withRepeat, withSpring, withTiming } from 'react-native-reanimated';

import { MasterGlass } from './MasterGlass';
import { normalizarPorcentaje } from './progreso';

type MasterProgressbarProps = {
  altura?: number;
  porcentaje: number;
  style?: StyleProp<ViewStyle>;
  colorBase?: string;
};

type BurbujaProps = {
  demora: number;
  duracion: number;
  izquierda: string;
  tamano: number;
  arriba: number;
};

function mezclarColor(hex: string, porcentaje: number, haciaBlanco: boolean) {
  const limpio = hex.replace('#', '');
  const r = parseInt(limpio.slice(0, 2), 16);
  const g = parseInt(limpio.slice(2, 4), 16);
  const b = parseInt(limpio.slice(4, 6), 16);
  const t = haciaBlanco ? 255 : 0;
  const nr = Math.round(r + (t - r) * porcentaje).toString(16).padStart(2, '0');
  const ng = Math.round(g + (t - g) * porcentaje).toString(16).padStart(2, '0');
  const nb = Math.round(b + (t - b) * porcentaje).toString(16).padStart(2, '0');
  return `#${nr}${ng}${nb}`;
}

function Burbuja({ arriba, demora, duracion, izquierda, tamano }: BurbujaProps) {
  const desplazamiento = useSharedValue(-tamano);

  useEffect(() => {
    desplazamiento.value = withDelay(demora, withRepeat(withTiming(240, { duration: duracion, easing: Easing.linear }), -1, false));
    return () => cancelAnimation(desplazamiento);
  }, [demora, desplazamiento, duracion, tamano]);

  const estiloAnimado = useAnimatedStyle(() => ({ transform: [{ translateX: desplazamiento.value }] }));
  return <Animated.View pointerEvents="none" style={[styles.burbuja, estiloAnimado, { borderRadius: tamano / 2, height: tamano, left: izquierda as `${number}%`, top: arriba, width: tamano }]} />;
}

export function MasterProgressbar({ altura = 12, porcentaje, style, colorBase }: MasterProgressbarProps) {
  const progreso = useSharedValue(normalizarPorcentaje(porcentaje));
  const porcentajeSeguro = normalizarPorcentaje(porcentaje);

  useEffect(() => {
    progreso.value = withSpring(porcentajeSeguro, { damping: 16, stiffness: 125 });
  }, [porcentajeSeguro, progreso]);

  const estiloRelleno = useAnimatedStyle(() => ({ width: `${progreso.value}%` }));
  const radio = altura / 2;

  const coloresGradiente = colorBase
    ? [mezclarColor(colorBase, 0.2, false), colorBase, mezclarColor(colorBase, 0.4, true)]
    : ['#1F7C3E', '#58BE68', '#9AE59C'];

  const coloresFondo = colorBase
    ? [mezclarColor(colorBase, 0.85, true), mezclarColor(colorBase, 0.92, true)]
    : ['#edfaed', '#f4ffea'];

  return (
    <MasterGlass style={[styles.marco, { borderRadius: radio, height: altura }, style]}>
      <LinearGradient colors={coloresFondo} end={{ x: 1, y: 0 }} start={{ x: 0, y: 0 }} style={[styles.pista, { borderRadius: radio }]}>
        <Animated.View style={[styles.relleno, estiloRelleno, { borderRadius: radio }]}>
          <LinearGradient colors={coloresGradiente} end={{ x: 1, y: 0 }} start={{ x: 0, y: 0 }} style={styles.liquido}>
            {porcentajeSeguro > 0 ? <>
              <Burbuja arriba={altura * 0.45} demora={0} duracion={2600} izquierda="8%" tamano={Math.max(2, altura * 0.36)} />
              <Burbuja arriba={altura * 0.12} demora={500} duracion={2200} izquierda="32%" tamano={Math.max(2, altura * 0.28)} />
              <Burbuja arriba={-altura * 0.12} demora={1000} duracion={3100} izquierda="58%" tamano={Math.max(3, altura * 0.46)} />
              <Burbuja arriba={altura * 0.5} demora={1500} duracion={2400} izquierda="78%" tamano={Math.max(2, altura * 0.3)} />
            </> : null}
          </LinearGradient>
        </Animated.View>
      </LinearGradient>
    </MasterGlass>
  );
}

const styles = StyleSheet.create({
  burbuja: { backgroundColor: 'rgba(255,255,255,0.48)', position: 'absolute' },
  liquido: { flex: 1, overflow: 'hidden' },
  marco: { boxShadow: '0px 3px 6px rgba(11, 116, 50, 0.16)', overflow: 'hidden', width: '100%' },
  pista: { flex: 1, overflow: 'hidden' },
  relleno: { height: '100%', overflow: 'hidden' },
});
