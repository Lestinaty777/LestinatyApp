import React, { useMemo, useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import Animated, { useSharedValue, useDerivedValue, withTiming, Easing, interpolate, Extrapolation, withSpring } from 'react-native-reanimated';
import { BlurMask, Canvas, Group, Oval } from '@shopify/react-native-skia';

import { construirCaminosMandala, trazoDesdeSemilla } from '../../../habitos/mandalaGeometria';
import type { TrazoMandala } from '../../../habitos/mandalaNodo.tipos';

const RADIO_GEOMETRIA = 150;
const VIEWBOX = RADIO_GEOMETRIA * 2 + 20;

export type MandalaCargaInteractivaProps = {
  porcentaje: number;
  colorBase: string;
  tamano: number;
  semilla: string;
  children?: React.ReactNode;
};

export function MandalaCargaInteractiva({ porcentaje, colorBase, tamano, semilla, children }: MandalaCargaInteractivaProps) {
  // 1. Generar la ruta base completa (aprox 47 puntos) una sola vez según la semilla
  const puntosBase = useMemo(() => {
    return trazoDesdeSemilla(semilla, RADIO_GEOMETRIA * 0.85);
  }, [semilla]);

  // Interpolación suave del porcentaje en el UI Thread
  const animPorcentaje = useSharedValue(0);

  useEffect(() => {
    if (porcentaje === 0) {
      animPorcentaje.value = withSpring(0, { damping: 15, stiffness: 150 });
    } else {
      animPorcentaje.value = withTiming(porcentaje, { duration: 80, easing: Easing.linear });
    }
  }, [porcentaje, animPorcentaje]);

  // Sincronizar el valor animado con el JS Thread para poder redibujar el SVG
  const [porcentajeVisual, setPorcentajeVisual] = useState(0);
  
  useEffect(() => {
    let frameId: number;
    function actualizar() {
      // Solo forzamos re-render si hay un cambio notable, logrando unos 60fps efectivos
      if (Math.abs(animPorcentaje.value - porcentajeVisual) > 0.1) {
         setPorcentajeVisual(animPorcentaje.value);
      }
      frameId = requestAnimationFrame(actualizar);
    }
    frameId = requestAnimationFrame(actualizar);
    return () => cancelAnimationFrame(frameId);
  }, [animPorcentaje, porcentajeVisual]);

  // 2. Extraer el segmento visible exacto (interpolando para que sea 100% fluido)
  const caminos = useMemo(() => {
    if (porcentajeVisual <= 0.1) return [];

    const t = Math.max(0, Math.min(1, porcentajeVisual / 100));
    const indiceFlotante = t * (puntosBase.length - 1);
    const indice = Math.floor(indiceFlotante);
    const fraccion = indiceFlotante - indice;

    const trazoVisible: TrazoMandala[] = puntosBase.slice(0, Math.max(1, indice + 1));

    // Interpolar el último punto para que el crecimiento de la curva sea continuo
    if (indice < puntosBase.length - 1 && fraccion > 0 && trazoVisible.length > 0) {
      const pA = puntosBase[indice];
      const pB = puntosBase[indice + 1];
      trazoVisible.push({
        x: pA.x + (pB.x - pA.x) * fraccion,
        y: pA.y + (pB.y - pA.y) * fraccion,
      });
    }

    if (trazoVisible.length < 2) return [];

    // 3. Pasar por el sistema Catmull-Rom de la app (reescala a 9 controles, suaviza y pliega 7 veces)
    const anchoBase = tamano * 0.16;
    return construirCaminosMandala(trazoVisible, anchoBase);
  }, [puntosBase, porcentajeVisual, tamano]);

  // Animaciones del halo de energía
  const opacidadGlow = useDerivedValue(() => interpolate(animPorcentaje.value, [0, 100], [0, 0.45], Extrapolation.CLAMP));
  const escalaGlow = useDerivedValue(() => interpolate(animPorcentaje.value, [0, 100], [0.8, 1.05], Extrapolation.CLAMP));

  return (
    <View style={{ width: tamano, height: tamano, alignItems: 'center', justifyContent: 'center' }}>
      {/* Halo de energía Skia (Glow) */}
      <Canvas pointerEvents="none" style={StyleSheet.absoluteFill}>
        <Group opacity={opacidadGlow} origin={{ x: tamano/2, y: tamano/2 }} transform={useDerivedValue(() => [{ scale: escalaGlow.value }])}>
          <Oval 
            color={colorBase} 
            height={tamano * 0.65} 
            width={tamano * 0.65} 
            x={tamano * 0.175} 
            y={tamano * 0.175}
          >
            <BlurMask blur={tamano * 0.12} style="normal" />
          </Oval>
        </Group>
      </Canvas>

      {/* Trazos vectoriales exactos Catmull-Rom */}
      <View style={[StyleSheet.absoluteFill, { opacity: porcentajeVisual > 0 ? 1 : 0 }]}>
        <Svg height={tamano} viewBox={`${-VIEWBOX / 2} ${-VIEWBOX / 2} ${VIEWBOX} ${VIEWBOX}`} width={tamano}>
          {caminos.map((d, indice) => (
            d ? <Path d={d} fill={colorBase} fillOpacity={0.96} key={indice} /> : null
          ))}
        </Svg>
      </View>

      {/* Punto central (botón) */}
      <View style={[StyleSheet.absoluteFill, { justifyContent: 'center', alignItems: 'center' }]} pointerEvents="none">
        {children}
      </View>
    </View>
  );
}
