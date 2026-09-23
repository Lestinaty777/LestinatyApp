import { useEffect, useMemo } from 'react';
import { StyleSheet, useWindowDimensions, View } from 'react-native';
import { BlurMask, Canvas, Group, Line, Rect, vec } from '@shopify/react-native-skia';
import { Easing, useDerivedValue, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';

import { detenerLluviaLoop, iniciarLluviaLoop } from '../../../../nucleo/dispositivo/sonido';

const NUM_GOTAS = 46;

function hashUnidad(seed: number, i: number) {
  const v = Math.sin(seed * 12.9898 + i * 78.233) * 43758.5453;
  return v - Math.floor(v);
}

function generarGotas(ancho: number, altoPatron: number) {
  return Array.from({ length: NUM_GOTAS }, (_, i) => ({
    largo: 12 + hashUnidad(2.05, i) * 14,
    x: hashUnidad(4.71, i) * ancho,
    y: hashUnidad(9.13, i) * altoPatron,
  }));
}

// Se monta condicionado a `!puedeAvanzarHoy && diasCompletados > 0` en
// MapaSenderosPantalla.tsx — su propio ciclo de montaje/desmontaje ya
// arranca y corta tanto la animación como el sonido en loop, sin lógica
// aparte en el padre.
//
// Truco de scroll infinito: un solo valor animado (translateY de 0→alto,
// sin loop invertido) mueve el grupo entero; las gotas se dibujan DOS
// veces (una copia desplazada -alto), así que cuando la copia de arriba
// entra a cuadro la de abajo sale exactamente donde empezó — el reinicio
// del ciclo es imperceptible, sin animar cada gota por separado.
export function AmbienteLluviaMapa({ alto }: { alto: number }) {
  const { width } = useWindowDimensions();
  const gotas = useMemo(() => generarGotas(width, alto), [width, alto]);
  const progreso = useSharedValue(0);

  useEffect(() => {
    progreso.value = withRepeat(withTiming(1, { duration: 2200, easing: Easing.linear }), -1, false);
    void iniciarLluviaLoop();
    return () => { detenerLluviaLoop(); };
  }, [progreso]);

  const transformGrupo = useDerivedValue(() => [{ translateY: progreso.value * alto }]);

  return (
    <View pointerEvents="none" style={[StyleSheet.absoluteFill, { height: alto }]}>
      <Canvas style={StyleSheet.absoluteFill}>
        <Rect color="#4A5578" height={alto} opacity={0.16} width={width} x={0} y={0}>
          <BlurMask blur={32} style="normal" />
        </Rect>
        <Group opacity={0.26} transform={transformGrupo}>
          {[0, 1].flatMap((copia) => gotas.map((gota, indice) => (
            <Line
              color="#C9D0EA"
              key={`${copia}-${indice}`}
              p1={vec(gota.x, gota.y - alto + copia * alto)}
              p2={vec(gota.x - 3, gota.y - alto + copia * alto + gota.largo)}
              strokeWidth={1.4}
            />
          )))}
        </Group>
      </Canvas>
    </View>
  );
}
