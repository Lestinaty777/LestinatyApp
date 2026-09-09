import React, { useEffect } from 'react';
import { StyleSheet } from 'react-native';
import {
  Canvas,
  Path,
  LinearGradient,
  vec,
  Group,
  BlurMask,
} from '@shopify/react-native-skia';
import {
  useSharedValue,
  withRepeat,
  withTiming,
  Easing,
  useDerivedValue,
} from 'react-native-reanimated';

export type TemaAurora = 'morado' | 'amarillo' | 'verde';

interface Props {
  tema?: TemaAurora;
}

export function AuroraBoreal({ tema = 'morado' }: Props) {
  const p1 = useSharedValue(0);
  const p2 = useSharedValue(0);
  const p3 = useSharedValue(0);

  useEffect(() => {
    p1.value = withRepeat(
      withTiming(2 * Math.PI, { duration: 8000, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );
    p2.value = withRepeat(
      withTiming(2 * Math.PI, { duration: 12000, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );
    p3.value = withRepeat(
      withTiming(2 * Math.PI, { duration: 10000, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );
  }, []);

  // Animaciones suaves usando senos y cosenos
  const t1 = useDerivedValue(() => [
    { translateY: Math.sin(p1.value) * 15 },
    { translateX: Math.cos(p1.value) * 10 },
  ]);

  const t2 = useDerivedValue(() => [
    { translateY: Math.cos(p2.value) * 20 },
    { translateX: Math.sin(p2.value) * 15 },
  ]);

  const t3 = useDerivedValue(() => [
    { translateY: Math.sin(p3.value) * 10 - 10 },
    { translateX: Math.cos(p3.value) * 20 },
  ]);

  // Líneas curvas en la esquina superior izquierda
  const path1 = "M -20 -20 Q 80 120, 250 80 T 400 200";
  const path2 = "M -50 40 Q 50 180, 200 120 T 350 250";
  const path3 = "M -30 100 Q 100 240, 280 150 T 420 300";

  const colores = tema === 'amarillo'
    ? {
        l1: ['rgba(245, 158, 11, 0.8)', 'rgba(252, 211, 77, 0.2)'],
        l2: ['rgba(251, 191, 36, 0.7)', 'rgba(253, 230, 138, 0.1)'],
        l3: ['rgba(217, 119, 6, 0.6)', 'rgba(245, 158, 11, 0)'],
      }
    : tema === 'verde'
      ? {
          l1: ['rgba(34, 197, 94, 0.8)', 'rgba(134, 239, 172, 0.2)'],
          l2: ['rgba(74, 222, 128, 0.7)', 'rgba(187, 247, 208, 0.1)'],
          l3: ['rgba(21, 128, 61, 0.6)', 'rgba(74, 222, 128, 0)'],
        }
      : {
        l1: ['rgba(124, 58, 237, 0.8)', 'rgba(192, 132, 252, 0.2)'],
        l2: ['rgba(167, 139, 250, 0.7)', 'rgba(216, 180, 254, 0.1)'],
        l3: ['rgba(109, 40, 217, 0.6)', 'rgba(139, 92, 246, 0)'],
      };

  return (
    <Canvas style={StyleSheet.absoluteFill} pointerEvents="none">
      <Group>
        <BlurMask blur={8} style="normal" />
        
        {/* Línea 1 */}
        <Group transform={t1}>
          <Path
            path={path1}
            style="stroke"
            strokeWidth={14}
            strokeCap="round"
          >
            <LinearGradient
              start={vec(0, 0)}
              end={vec(300, 200)}
              colors={colores.l1}
            />
          </Path>
        </Group>

        {/* Línea 2 */}
        <Group transform={t2}>
          <Path
            path={path2}
            style="stroke"
            strokeWidth={18}
            strokeCap="round"
          >
            <LinearGradient
              start={vec(0, 50)}
              end={vec(250, 250)}
              colors={colores.l2}
            />
          </Path>
        </Group>

        {/* Línea 3 */}
        <Group transform={t3}>
          <Path
            path={path3}
            style="stroke"
            strokeWidth={10}
            strokeCap="round"
          >
            <LinearGradient
              start={vec(0, 100)}
              end={vec(350, 300)}
              colors={colores.l3}

            />
          </Path>
        </Group>
      </Group>
    </Canvas>
  );
}
