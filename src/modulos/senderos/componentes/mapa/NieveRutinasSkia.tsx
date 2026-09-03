import React, { useEffect, useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useDerivedValue, useSharedValue, withRepeat, withTiming, type SharedValue } from 'react-native-reanimated';

type SkiaModule = typeof import('@shopify/react-native-skia');

type Copo = { deriva: number; opacidad: number; radio: number; velocidad: number; x: number; y: number };
const colorNieve = '#C9E7FA';

let moduloSkia: SkiaModule | null = null;
try {
  // No RuntimeEffect: Canvas, Circle and opacity work in more native runtimes.
  moduloSkia = require('@shopify/react-native-skia') as SkiaModule;
} catch {
  moduloSkia = null;
}

function crearCopos(ancho: number, alto: number): Copo[] {
  return Array.from({ length: 46 }, (_, indice) => {
    const profundidad = indice % 3;
    return {
      deriva: 5 + (indice % 5) * 2,
      opacidad: profundidad === 0 ? 0.38 : profundidad === 1 ? 0.62 : 0.88,
      radio: profundidad === 0 ? 1.5 : profundidad === 1 ? 2.2 : 3.1,
      velocidad: profundidad === 0 ? 13 : profundidad === 1 ? 21 : 30,
      x: ((indice * 47 + 19) % Math.max(1, Math.round(ancho))) + 2,
      y: ((indice * 79 + 31) % Math.max(1, Math.round(alto))),
    };
  });
}

export function NieveRutinasSkia({ alto, ancho }: { alto: number; ancho: number }) {
  const [Skia, setSkia] = useState<SkiaModule | null>(moduloSkia);
  const copos = useMemo(() => crearCopos(ancho, alto), [alto, ancho]);
  const progreso = useSharedValue(0);

  useEffect(() => {
    if (Skia) return;
    try {
      const modulo = require('@shopify/react-native-skia') as SkiaModule;
      if ((modulo as any).Canvas && (modulo as any).Circle) setSkia(modulo);
    } catch {
      // The fallback below keeps Expo Go safe when Skia is unavailable.
    }
  }, [Skia]);

  useEffect(() => {
    // This clock runs on the UI thread, so snowfall stays smooth even when JS is busy.
    progreso.value = 0;
    progreso.value = withRepeat(withTiming(1, { duration: 9200, easing: Easing.linear }), -1, false);
  }, [progreso]);

  if (Skia) {
    const Canvas = (Skia as any).Canvas;
    const Circle = (Skia as any).Circle;
    return (
      <View pointerEvents="none" style={[styles.raiz, { height: alto, width: ancho }]}>
        <Canvas style={StyleSheet.absoluteFill}>
          {copos.map((copo, indice) => {
            return <CopoSkia Circle={Circle} alto={alto} copo={copo} key={indice} progreso={progreso} />;
          })}
        </Canvas>
      </View>
    );
  }

  return (
    <View pointerEvents="none" style={[styles.raiz, { height: alto, width: ancho }]}>
      {copos.map((copo, indice) => {
        return <CopoFallback alto={alto} copo={copo} key={indice} progreso={progreso} />;
      })}
    </View>
  );
}

function CopoSkia({ Circle, alto, copo, progreso }: { Circle: any; alto: number; copo: Copo; progreso: SharedValue<number> }) {
  const cx = useDerivedValue(() => copo.x + Math.sin(progreso.value * Math.PI * 2 * 1.7 + copo.y) * copo.deriva);
  const cy = useDerivedValue(() => (copo.y + progreso.value * 9200 / 1000 * copo.velocidad) % (alto + 28) - 14);

  return <Circle color={colorNieve} cx={cx} cy={cy} opacity={copo.opacidad} r={copo.radio} />;
}

function CopoFallback({ alto, copo, progreso }: { alto: number; copo: Copo; progreso: SharedValue<number> }) {
  const estiloAnimado = useAnimatedStyle(() => ({
    transform: [
      { translateX: Math.sin(progreso.value * Math.PI * 2 * 1.7 + copo.y) * copo.deriva },
      { translateY: (progreso.value * 9200 / 1000 * copo.velocidad) % (alto + 28) - 14 },
    ],
  }));

  return (
    <Animated.View
      style={[
        styles.copoFallback,
        estiloAnimado,
        { height: copo.radio * 2, left: copo.x, opacity: copo.opacidad, top: copo.y, width: copo.radio * 2 },
      ]}
    />
  );
}

const styles = StyleSheet.create({
  raiz: {
    left: 0,
    overflow: 'hidden',
    position: 'absolute',
    top: 0,
  },
  copoFallback: {
    backgroundColor: colorNieve,
    borderRadius: 999,
    position: 'absolute',
  },
});
