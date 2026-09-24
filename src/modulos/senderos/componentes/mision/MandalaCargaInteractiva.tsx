import React, { useMemo, useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { useSharedValue, useDerivedValue, withTiming, Easing, interpolate, Extrapolation, withSpring, withRepeat, type SharedValue } from 'react-native-reanimated';
import { BlurMask, Canvas, Group, Oval, Path, Skia, Circle, DashPathEffect } from '@shopify/react-native-skia';

const RADIO_GEOMETRIA = 100;

function simpleHash(str: string) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0; 
  }
  return Math.abs(hash);
}

function buildPolygon(cx: number, cy: number, radius: number, sides: number) {
  const path = Skia.Path.Make();
  const angleStep = (Math.PI * 2) / sides;
  for (let i = 0; i <= sides; i++) {
    const a = i * angleStep - Math.PI / 2; // Apuntar hacia arriba
    const px = cx + radius * Math.cos(a);
    const py = cy + radius * Math.sin(a);
    if (i === 0) path.moveTo(px, py);
    else path.lineTo(px, py);
  }
  path.close();
  return path;
}

function buildCirclePath(cx: number, cy: number, radius: number) {
  const path = Skia.Path.Make();
  path.addCircle(cx, cy, radius);
  return path;
}

type CapaGeometria = { path: any; escala: number; rotInicial: number; velocidad: number };
type ConfigParticulas = { r1: number; r2: number; v1: number; v2: number; dash1: number[]; dash2: number[] };

export type MandalaCargaInteractivaProps = {
  porcentaje: number;
  colorBase: string;
  tamano: number;
  semilla?: string;
  children?: React.ReactNode;
};

// --- Subcomponentes Skia encapsulados para usar Hooks (useDerivedValue) ---

function CapaGeometriaSkia({ capa, color, progresoVisual, rotacionGlobal, escalaGlobal, cx, cy }: { capa: CapaGeometria, color: string, progresoVisual: SharedValue<number>, rotacionGlobal: SharedValue<number>, escalaGlobal: SharedValue<number>, cx: number, cy: number }) {
  const transformacion = useDerivedValue(() => [
    { scale: escalaGlobal.value * capa.escala },
    { rotate: rotacionGlobal.value * capa.velocidad + capa.rotInicial }
  ]);
  return (
    <Group origin={{ x: cx, y: cy }} transform={transformacion}>
      <Path path={capa.path} color={color} style="stroke" strokeWidth={2} strokeJoin="round" opacity={0.15} />
      <Path path={capa.path} color={color} style="stroke" strokeWidth={7} strokeJoin="round" end={progresoVisual} opacity={0.2}>
        <BlurMask blur={4} style="normal" />
      </Path>
      <Path path={capa.path} color={color} style="stroke" strokeWidth={4.5} strokeJoin="round" end={progresoVisual} opacity={0.95} />
    </Group>
  );
}

function OrbitaParticulasSkia({ config, color, escalaGlobal, rotacionGlobal, progresoVisual, cx, cy }: { config: ConfigParticulas, color: string, escalaGlobal: SharedValue<number>, rotacionGlobal: SharedValue<number>, progresoVisual: SharedValue<number>, cx: number, cy: number }) {
  const t1 = useDerivedValue(() => [{ scale: escalaGlobal.value }, { rotate: rotacionGlobal.value * config.v1 }]);
  const t2 = useDerivedValue(() => [{ scale: escalaGlobal.value }, { rotate: rotacionGlobal.value * config.v2 }]);
  const opacidad = useDerivedValue(() => interpolate(progresoVisual.value, [0, 1], [0, 0.6], Extrapolation.CLAMP));
  return (
    <>
      <Group origin={{ x: cx, y: cy }} transform={t1} opacity={opacidad}>
        <Circle cx={cx} cy={cy} r={config.r1} color={color} style="stroke" strokeWidth={3} strokeCap="round">
          <DashPathEffect intervals={config.dash1} phase={0} />
        </Circle>
      </Group>
      <Group origin={{ x: cx, y: cy }} transform={t2} opacity={opacidad}>
        <Circle cx={cx} cy={cy} r={config.r2} color={color} style="stroke" strokeWidth={2} strokeCap="round">
          <DashPathEffect intervals={config.dash2} phase={0} />
        </Circle>
      </Group>
    </>
  );
}

// --- Componente Principal ---

export function MandalaCargaInteractiva({ porcentaje, colorBase, tamano, semilla, children }: MandalaCargaInteractivaProps) {
  const cx = tamano / 2;
  const cy = tamano / 2;

  // 1. GENERADOR PROCEDURAL DE GEOMETRÍA SAGRADA
  const { capas, particulas } = useMemo(() => {
    const seedVal = simpleHash(semilla ?? 'merkaba');
    const estilo = seedVal % 3;
    const numCapas = 2 + (seedVal % 3); // 2, 3 o 4 figuras entrelazadas
    const R = RADIO_GEOMETRIA;
    const nuevasCapas: CapaGeometria[] = [];

    if (estilo === 0) {
      // Familia 0: Entrelazados (Ej. Merkaba, Estrellas)
      const lados = 3 + ((seedVal >> 1) % 2); // Triángulos o Cuadrados
      for (let i = 0; i < numCapas; i++) {
        nuevasCapas.push({ path: buildPolygon(cx, cy, R, lados), escala: 1, rotInicial: (Math.PI * 2 / numCapas) * i, velocidad: i % 2 === 0 ? 1 : -1 });
      }
    } else if (estilo === 1) {
      // Familia 1: Portales Concéntricos
      const lados = 3 + ((seedVal >> 2) % 4); // Tri, Cuadrado, Penta, Hexa
      for (let i = 0; i < numCapas; i++) {
        nuevasCapas.push({ path: buildPolygon(cx, cy, R, lados), escala: 1 - (i * 0.22), rotInicial: (seedVal >> i) % 2 === 0 ? Math.PI/4 : 0, velocidad: i % 2 === 0 ? (i * 0.5 + 1) : -(i * 0.5 + 1) });
      }
    } else {
      // Familia 2: Sello Alquímico (Formas mixtas concéntricas)
      const ladosBase = 4 + ((seedVal >> 3) % 3); // 4, 5 o 6
      nuevasCapas.push({ path: buildPolygon(cx, cy, R, ladosBase), escala: 1, rotInicial: 0, velocidad: 1 });
      nuevasCapas.push({ path: buildCirclePath(cx, cy, R * 0.78), escala: 1, rotInicial: 0, velocidad: -1.2 });
      nuevasCapas.push({ path: buildPolygon(cx, cy, R * 0.55, 3), escala: 1, rotInicial: Math.PI, velocidad: 2 });
    }

    const configsParticulas: ConfigParticulas = {
      r1: R * (1.2 + (seedVal % 10) * 0.02),
      r2: R * (1.4 + ((seedVal >> 1) % 10) * 0.03),
      v1: seedVal % 2 === 0 ? 2 : -2,
      v2: (seedVal >> 1) % 2 === 0 ? -1.5 : 1.5,
      dash1: [2, 30 + (seedVal % 20)],
      dash2: [2, 40 + ((seedVal >> 1) % 20)],
    };

    return { capas: nuevasCapas, particulas: configsParticulas };
  }, [cx, cy, semilla]);

  // Variables Animadas Reanimated
  const animPorcentaje = useSharedValue(0);
  const rotacion = useSharedValue(0);

  useEffect(() => {
    if (porcentaje === 0) {
      animPorcentaje.value = withSpring(0, { damping: 15, stiffness: 150 });
    } else {
      animPorcentaje.value = withSpring(porcentaje, { damping: 25, stiffness: 150, mass: 0.8 });
    }
  }, [porcentaje, animPorcentaje]);

  useEffect(() => {
    rotacion.value = withRepeat(withTiming(Math.PI * 2, { duration: 20000, easing: Easing.linear }), -1, false);
  }, [rotacion]);

  // Derivados Nativos Skia
  const progresoVisual = useDerivedValue(() => Math.max(0, Math.min(1, animPorcentaje.value / 100)));
  const escalaBase = useDerivedValue(() => interpolate(progresoVisual.value, [0, 1], [0.85, 1.4], Extrapolation.CLAMP));
  const opacidadGlow = useDerivedValue(() => interpolate(progresoVisual.value, [0, 1], [0, 0.2], Extrapolation.CLAMP));

  return (
    <View style={{ width: tamano, height: tamano, alignItems: 'center', justifyContent: 'center' }}>
      <Canvas pointerEvents="none" style={StyleSheet.absoluteFill}>
        
        {/* Halo Místico */}
        <Group opacity={opacidadGlow} origin={{ x: cx, y: cy }} transform={useDerivedValue(() => [{ scale: escalaBase.value }])}>
          <Oval color={colorBase} height={tamano * 0.7} width={tamano * 0.7} x={tamano * 0.15} y={tamano * 0.15}>
            <BlurMask blur={tamano * 0.15} style="normal" />
          </Oval>
        </Group>

        {/* Órbitas Procedurales */}
        <OrbitaParticulasSkia config={particulas} color={colorBase} escalaGlobal={escalaBase} rotacionGlobal={rotacion} progresoVisual={progresoVisual} cx={cx} cy={cy} />

        {/* Capas Geométricas Procedurales */}
        {capas.map((capa, i) => (
          <CapaGeometriaSkia key={i} capa={capa} color={colorBase} progresoVisual={progresoVisual} rotacionGlobal={rotacion} escalaGlobal={escalaBase} cx={cx} cy={cy} />
        ))}
      </Canvas>

      <View style={[StyleSheet.absoluteFill, { justifyContent: 'center', alignItems: 'center' }]} pointerEvents="none">
        {children}
      </View>
    </View>
  );
}
