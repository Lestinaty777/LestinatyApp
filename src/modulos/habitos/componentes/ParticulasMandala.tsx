import { useEffect, useMemo } from 'react';
import { StyleSheet } from 'react-native';
import { BlurMask, Canvas, Circle, Group } from '@shopify/react-native-skia';
import { cancelAnimation, Easing, type SharedValue, useDerivedValue, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';

// Un ciclo del reloj; cada partícula recorre su subida 1 o 2 veces por ciclo
// (múltiplos enteros), así el reinicio del withRepeat no se nota.
const CICLO_MS = 7000;

type Particula = { x: number; fase: number; vueltas: number; vaiven: number; radio: number; brillo: number };

function azar(semilla: number) {
  const v = Math.sin(semilla * 12.9898) * 43758.5453;
  return v - Math.floor(v);
}

function crearParticulas(cantidad: number): Particula[] {
  return Array.from({ length: cantidad }, (_, i) => ({
    brillo: 0.55 + azar(i + 4.1) * 0.45,
    fase: azar(i + 1.7),
    radio: 0.6 + azar(i + 3.3) * 0.9,
    vaiven: 0.03 + azar(i + 2.9) * 0.05,
    vueltas: azar(i + 5.3) > 0.5 ? 2 : 1,
    x: 0.18 + azar(i + 0.5) * 0.64,
  }));
}

type ParticulasMandalaProps = {
  /** Lado del lienzo; las partículas suben por toda su altura. */
  tamano: number;
  cantidad: number;
  /** 0–1: opacidad máxima. Las mandalas del mapa que no son la última van suaves. */
  intensidad: number;
  /** Escala del tamaño de cada partícula (en px a tamaño 1). */
  escalaPunto?: number;
  /** Visibilidad animada externa (p. ej. aparecer con la levitación). */
  visibilidad?: SharedValue<number>;
};

// Polvo de luz blanco que sube despacio alrededor de la mandala y titila,
// dibujado en un solo <Canvas> de Skia con un reloj compartido.
export function ParticulasMandala({ cantidad, escalaPunto = 1.6, intensidad, tamano, visibilidad }: ParticulasMandalaProps) {
  const reloj = useSharedValue(0);
  const particulas = useMemo(() => crearParticulas(cantidad), [cantidad]);

  useEffect(() => {
    reloj.value = withRepeat(withTiming(1, { duration: CICLO_MS, easing: Easing.linear }), -1, false);
    return () => cancelAnimation(reloj);
  }, [reloj]);

  const opacidadGrupo = useDerivedValue(() => intensidad * (visibilidad ? visibilidad.value : 1));

  return (
    <Canvas pointerEvents="none" style={[StyleSheet.absoluteFill, { height: tamano, width: tamano }]}>
      <Group opacity={opacidadGrupo}>
        {particulas.map((particula, indice) => (
          <Mota escalaPunto={escalaPunto} key={indice} particula={particula} reloj={reloj} tamano={tamano} />
        ))}
      </Group>
    </Canvas>
  );
}

function Mota({ escalaPunto, particula, reloj, tamano }: { escalaPunto: number; particula: Particula; reloj: SharedValue<number>; tamano: number }) {
  const avance = useDerivedValue(() => {
    const t = reloj.value * particula.vueltas + particula.fase;
    return t - Math.floor(t);
  });
  const cx = useDerivedValue(() => tamano * (particula.x + Math.sin((reloj.value + particula.fase) * Math.PI * 2) * particula.vaiven));
  const cy = useDerivedValue(() => tamano * (0.92 - avance.value * 0.84));
  // Nace y muere transparente, con un titileo propio encima.
  const opacidad = useDerivedValue(() => {
    const vida = Math.sin(avance.value * Math.PI);
    const titileo = 0.65 + 0.35 * Math.sin((reloj.value * 6 + particula.fase) * Math.PI * 2);
    return vida * titileo * particula.brillo;
  });
  const r = particula.radio * escalaPunto;

  return (
    <Group opacity={opacidad}>
      <Circle color="#FFFFFF" cx={cx} cy={cy} r={r * 2.2} opacity={0.35}>
        <BlurMask blur={r * 1.6} style="normal" />
      </Circle>
      <Circle color="#FFFFFF" cx={cx} cy={cy} r={r} />
    </Group>
  );
}

type RafagaParticulasProps = {
  tamano: number;
  cantidad?: number;
  /** 0 → 1: la ráfaga sale del centro y se apaga. */
  progreso: SharedValue<number>;
};

// Ráfaga del anclaje: motas que salen del centro en abanico achatado (van
// por el suelo) y se desvanecen al terminar el destello.
export function RafagaParticulas({ cantidad = 14, progreso, tamano }: RafagaParticulasProps) {
  const motas = useMemo(() => Array.from({ length: cantidad }, (_, i) => ({
    angulo: (i / cantidad) * Math.PI * 2 + azar(i + 8.2) * 0.4,
    distancia: 0.3 + azar(i + 6.1) * 0.2,
    radio: 1 + azar(i + 7.4) * 1.4,
  })), [cantidad]);

  return (
    <Canvas pointerEvents="none" style={[StyleSheet.absoluteFill, { height: tamano, width: tamano }]}>
      {motas.map((mota, indice) => (
        <MotaRafaga key={indice} mota={mota} progreso={progreso} tamano={tamano} />
      ))}
    </Canvas>
  );
}

function MotaRafaga({ mota, progreso, tamano }: { mota: { angulo: number; distancia: number; radio: number }; progreso: SharedValue<number>; tamano: number }) {
  const cx = useDerivedValue(() => tamano / 2 + Math.cos(mota.angulo) * mota.distancia * tamano * progreso.value);
  const cy = useDerivedValue(() => tamano / 2 + Math.sin(mota.angulo) * mota.distancia * tamano * 0.4 * progreso.value - progreso.value * tamano * 0.08);
  const opacidad = useDerivedValue(() => (progreso.value === 0 ? 0 : 1 - progreso.value));

  return <Circle color="#FFFFFF" cx={cx} cy={cy} opacity={opacidad} r={mota.radio} />;
}
