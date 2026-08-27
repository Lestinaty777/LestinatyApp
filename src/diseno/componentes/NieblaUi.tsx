import { PropsWithChildren, useEffect, useMemo, useState } from 'react';
import { Platform, StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import Constants from 'expo-constants';
import { BlurView } from 'expo-blur';

type NieblaUiProps = PropsWithChildren<{
  style?: StyleProp<ViewStyle>;
}>;

type SkiaModule = typeof import('@shopify/react-native-skia');

let skiaModule: SkiaModule | null = null;
const usarFallback = Platform.OS === 'web' || Constants.executionEnvironment === 'storeClient' || Constants.appOwnership === 'expo';

if (!usarFallback) {
  try {
    // Skia is only safe to load on native in this project setup.
    // Web currently falls back to a blur-based approximation.
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    skiaModule = require('@shopify/react-native-skia') as SkiaModule;
  } catch {
    skiaModule = null;
  }
}

function NieblaFallback({ style }: { style?: StyleProp<ViewStyle> }) {
  const [time, setTime] = useState(0);

  useEffect(() => {
    const inicio = Date.now();
    const interval = setInterval(() => {
      setTime((Date.now() - inicio) / 1000);
    }, 33);

    return () => clearInterval(interval);
  }, []);

  const opacidad = useMemo(() => 0.56 + Math.sin(time * 0.8) * 0.04, [time]);

  return (
    <View pointerEvents="none" style={[styles.raizFallback, style]}>
      <View style={[styles.masa, styles.masa1, { opacity: opacidad }]} />
      <View style={[styles.masa, styles.masa2, { opacity: opacidad * 0.92 }]} />
      <View style={[styles.masa, styles.masa3, { opacity: opacidad * 0.86 }]} />
      <BlurView intensity={48} tint="light" style={styles.cubierta} />
    </View>
  );
}

function NieblaSkia({ style }: { style?: StyleProp<ViewStyle> }) {
  const [size, setSize] = useState({ width: 320, height: 280 });
  const [Skia, setSkia] = useState<SkiaModule | null>(skiaModule);
  const [time, setTime] = useState(0);

  useEffect(() => {
    if (Skia) return;

    let mounted = true;
    (async () => {
      try {
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const mod = require('@shopify/react-native-skia') as SkiaModule;
        if (mounted) setSkia(mod);
      } catch {
        if (mounted) setSkia(null);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [Skia]);

  useEffect(() => {
    const inicio = Date.now();
    const interval = setInterval(() => {
      setTime((Date.now() - inicio) / 1000);
    }, 33);

    return () => clearInterval(interval);
  }, []);

  const onLayout = (e: { nativeEvent: { layout: { width: number; height: number } } }) => {
    const { width, height } = e.nativeEvent.layout;
    setSize({ width, height });
  };

  if (!Skia) {
    return <NieblaFallback style={style} />;
  }

  const source = (Skia as any).RuntimeEffect?.Make(`
uniform float2 u_resolution;
uniform float u_time;

float hash(float2 p) {
  p = fract(p * float2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}

float noise(float2 p) {
  float2 i = floor(p);
  float2 f = fract(p);
  float a = hash(i);
  float b = hash(i + float2(1.0, 0.0));
  float c = hash(i + float2(0.0, 1.0));
  float d = hash(i + float2(1.0, 1.0));
  float2 u = f * f * (3.0 - 2.0 * f);
  return mix(a, b, u.x) + (c - a) * u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
}

float fbm(float2 p) {
  float value = 0.0;
  float amplitude = 0.5;
  for (int i = 0; i < 5; i++) {
    value += amplitude * noise(p);
    p *= 2.0;
    amplitude *= 0.5;
  }
  return value;
}

half4 main(float2 fragCoord) {
  float2 uv = fragCoord / u_resolution;
  float2 p1 = uv * float2(3.0, 2.0) + float2(u_time * 0.05, -u_time * 0.02);
  float2 p2 = uv * float2(5.0, 3.0) + float2(-u_time * 0.03, u_time * 0.015);

  float n1 = fbm(p1);
  float n2 = fbm(p2);
  float fog = smoothstep(0.35, 0.85, n1 * 0.6 + n2 * 0.4);

  half3 sky = half3(1.0, 1.0, 1.0);
  half3 finalColor = mix(sky, half3(1.0, 1.0, 1.0), fog * 0.9);
  return half4(finalColor, 0.95);
}
  `);

  if (!source) {
    return <NieblaFallback style={style} />;
  }

  return (
    <View pointerEvents="none" style={[styles.raiz, style]}>
      <Skia.Canvas style={styles.canvas} onLayout={onLayout}>
        <Skia.Fill>
          <Skia.Shader source={source} uniforms={{ u_resolution: [size.width, size.height], u_time: time }} />
        </Skia.Fill>
      </Skia.Canvas>
      <View style={styles.velo} />
    </View>
  );
}

export default function NieblaUi(props: NieblaUiProps) {
  return usarFallback ? <NieblaFallback style={props.style} /> : <NieblaSkia style={props.style} />;
}

const styles = StyleSheet.create({
  raiz: {
    overflow: 'hidden',
  },
  raizFallback: {
    overflow: 'hidden',
  },
  canvas: {
    ...StyleSheet.absoluteFill,
  },
  masa: {
    backgroundColor: 'rgba(255, 255, 255, 0.42)',
    borderRadius: 999,
    position: 'absolute',
  },
  masa1: {
    height: 180,
    left: -20,
    top: 8,
    width: 250,
  },
  masa2: {
    height: 220,
    left: 84,
    top: -10,
    width: 280,
  },
  masa3: {
    height: 160,
    right: -24,
    top: 24,
    width: 220,
  },
  cubierta: {
    ...StyleSheet.absoluteFill,
  },
  velo: {
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    ...StyleSheet.absoluteFill,
  },
});
