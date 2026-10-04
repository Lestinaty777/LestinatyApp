import { memo, useEffect, useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { cancelAnimation, Easing, type SharedValue, useAnimatedStyle, useDerivedValue, useSharedValue, withDelay, withRepeat, withSequence, withTiming } from 'react-native-reanimated';
import { BlurMask, Canvas, Circle, Group, Line, Path, Skia, type SkPath, vec } from '@shopify/react-native-skia';
import { Pointer } from 'lucide-react-native';

import { ANCHO_CINTA_MANDALA, LADO_LIENZO_MANDALA, RADIO_TRAZO_MANDALA } from '../../../habitos/componentes/MandalaExtruido';
import { prepararPoligonos } from '../../../habitos/mandalaExtrusion';
import { construirContornosMandala, PLIEGUES_MANDALA, resamplearTrazo, rotarPuntos, suavizarTrazo } from '../../../habitos/mandalaGeometria';
import type { TrazoMandala } from '../../../habitos/mandalaNodo.tipos';

const LADO = LADO_LIENZO_MANDALA;
const C = LADO / 2;
const RADIO_TINTA = RADIO_TRAZO_MANDALA + 8;
const LARGO_ESTELA = 7;
// Curva de ejemplo que dibuja la mano fantasma (unidades del lienzo).
const CURVA_PISTA: TrazoMandala[] = [
  { x: 12, y: -18 }, { x: 34, y: -58 }, { x: 72, y: -84 }, { x: 112, y: -70 }, { x: 122, y: -30 }, { x: 96, y: 4 }, { x: 60, y: 10 },
];
const MUESTRAS_PISTA = 48;

function pathDeContornos(trazos: TrazoMandala[], pliegues: number): SkPath | null {
  if (trazos.length < 2) return null;
  // Orientados igual: la regla "nonzero" une las cintas superpuestas.
  const poligonos = prepararPoligonos(construirContornosMandala(trazos, ANCHO_CINTA_MANDALA, pliegues));
  const path = Skia.Path.Make();
  for (const plano of poligonos) {
    path.moveTo(plano[0] + C, plano[1] + C);
    for (let i = 2; i < plano.length; i += 2) path.lineTo(plano[i] + C, plano[i + 1] + C);
    path.close();
  }
  return path;
}

/**
 * La mandala tal como se traza: cintas blancas con un halo suave. La usan el
 * lienzo en vivo y la mandala que levita, así el relevo al soltar no cambia
 * ni un píxel. `pliegues` por default es PLIEGUES_MANDALA (7, Hábitos) — esto
 * es exclusivo de Hábitos; el sello del sendero de días de Tareas usa su
 * propio componente, SiluetaSello en EscenarioTrazoSello.tsx (no es una
 * mandala, no tiene `pliegues`).
 */
export const CintasBlancas = memo(function CintasBlancas({ aura, pliegues = PLIEGUES_MANDALA, trazos }: { aura: string; pliegues?: number; trazos: TrazoMandala[] }) {
  const path = useMemo(() => pathDeContornos(trazos, pliegues), [trazos, pliegues]);
  if (!path) return null;
  // Aura en el color del paquete detrás del blanco: la mandala se sigue
  // leyendo cuando el velo se retira y queda sobre el mapa claro.
  return (
    <Canvas pointerEvents="none" style={styles.lienzo}>
      <Path color={aura} opacity={0.7} path={path}>
        <BlurMask blur={14} style="normal" />
      </Path>
      <Path color="#FFFFFF" opacity={0.45} path={path}>
        <BlurMask blur={9} style="normal" />
      </Path>
      <Path color="#FFFFFF" opacity={0.96} path={path} />
    </Canvas>
  );
});

// Rayos tenues desde el centro (7 en Hábitos, `pliegues` en general): la
// simetría se ve antes de trazar, y se encienden cuando el dedo pasa cerca
// de uno (todos a la vez: son la misma dirección repetida `pliegues` veces).
const RayosGuia = memo(function RayosGuia({ brillo, pliegues = PLIEGUES_MANDALA }: { brillo: SharedValue<number>; pliegues?: number }) {
  const rayos = useMemo(() => Array.from({ length: pliegues }, (_, k) => {
    const a = (k / pliegues) * Math.PI * 2;
    return { desde: vec(C + Math.cos(a) * 22, C + Math.sin(a) * 22), hasta: vec(C + Math.cos(a) * RADIO_TRAZO_MANDALA, C + Math.sin(a) * RADIO_TRAZO_MANDALA) };
  }), [pliegues]);
  const opacidad = useDerivedValue(() => 0.1 + brillo.value * 0.35);
  return (
    <Group opacity={opacidad}>
      {rayos.map((rayo, i) => <Line color="#FFFFFF" key={i} p1={rayo.desde} p2={rayo.hasta} strokeCap="round" strokeWidth={1} />)}
    </Group>
  );
});

// Anillo de tinta: se llena alrededor a medida que se gasta el trazo
// disponible; lleno = ya no queda tinta. Exportado: es genérico (no depende
// de pliegues ni de la geometría de la figura), lo reusa EscenarioTrazoSello.
export const AnilloTinta = memo(function AnilloTinta({ color, tinta }: { color: string; tinta: SharedValue<number> }) {
  const circulo = useMemo(() => {
    const path = Skia.Path.Make();
    path.addArc({ height: RADIO_TINTA * 2, width: RADIO_TINTA * 2, x: C - RADIO_TINTA, y: C - RADIO_TINTA }, -90, 359.9);
    return path;
  }, []);
  return (
    <>
      <Path color="#FFFFFF" opacity={0.12} path={circulo} strokeWidth={2} style="stroke" />
      <Path color={color} end={tinta} opacity={0.5} path={circulo} strokeCap="round" strokeWidth={6} style="stroke">
        <BlurMask blur={4} style="normal" />
      </Path>
      <Path color={color} end={tinta} path={circulo} strokeCap="round" strokeWidth={2.5} style="stroke" />
    </>
  );
});

// Puntas de luz: la cabeza del trazo, repetida en las `pliegues` copias, con
// una estela corta que se apaga detrás.
function PuntasDeLuz({ pliegues = PLIEGUES_MANDALA, puntos }: { pliegues?: number; puntos: TrazoMandala[] }) {
  const estela = puntos.slice(-LARGO_ESTELA);
  if (estela.length === 0) return null;
  const copias = Array.from({ length: pliegues }, (_, k) => rotarPuntos(estela, (k / pliegues) * Math.PI * 2));
  return (
    <>
      {copias.map((copia, k) => copia.map((p, i) => {
        const cabeza = i === copia.length - 1;
        const vida = (i + 1) / copia.length;
        return cabeza ? (
          <Circle color="#FFFFFF" cx={p.x + C} cy={p.y + C} key={`${k}-${i}`} r={5}>
            <BlurMask blur={4} style="solid" />
          </Circle>
        ) : (
          <Circle color="#FFFFFF" cx={p.x + C} cy={p.y + C} key={`${k}-${i}`} opacity={vida * 0.55} r={1.2 + vida * 2} />
        );
      }))}
    </>
  );
}

// Mano fantasma: la primera vez, una mano recorre una curva de ejemplo y la
// figura fantasma se dibuja sola en las `pliegues` copias, hasta el primer toque.
const ManoFantasma = memo(function ManoFantasma({ pliegues = PLIEGUES_MANDALA }: { pliegues?: number }) {
  const avance = useSharedValue(0);
  const { copias, muestras } = useMemo(() => {
    const curva = resamplearTrazo(suavizarTrazo(resamplearTrazo(CURVA_PISTA)), MUESTRAS_PISTA);
    const paths = Array.from({ length: pliegues }, (_, k) => {
      const rotada = rotarPuntos(curva, (k / pliegues) * Math.PI * 2);
      const path = Skia.Path.Make();
      rotada.forEach((p, i) => (i === 0 ? path.moveTo(p.x + C, p.y + C) : path.lineTo(p.x + C, p.y + C)));
      return path;
    });
    return { copias: paths, muestras: curva.flatMap((p) => [p.x + C, p.y + C]) };
  }, [pliegues]);

  useEffect(() => {
    avance.value = withRepeat(withSequence(
      withTiming(1, { duration: 2400, easing: Easing.inOut(Easing.cubic) }),
      withDelay(900, withTiming(0, { duration: 0 })),
    ), -1, false);
    return () => cancelAnimation(avance);
  }, [avance]);

  const opacidad = useDerivedValue(() => Math.min(1, avance.value * 6) * 0.4);
  const estiloMano = useAnimatedStyle(() => {
    const n = muestras.length / 2;
    const i = Math.min(n - 1, Math.floor(avance.value * (n - 1)));
    return {
      opacity: Math.min(1, avance.value * 6) * 0.85,
      transform: [{ translateX: muestras[i * 2] - 9 }, { translateY: muestras[i * 2 + 1] - 3 }],
    };
  });

  return (
    <>
      <Canvas pointerEvents="none" style={styles.lienzo}>
        <Group opacity={opacidad}>
          {copias.map((path, i) => <Path color="#FFFFFF" end={avance} key={i} path={path} strokeCap="round" strokeWidth={3} style="stroke" />)}
        </Group>
      </Canvas>
      <Animated.View pointerEvents="none" style={[styles.mano, estiloMano]}>
        <Pointer color="#FFFFFF" size={34} strokeWidth={1.6} />
      </Animated.View>
    </>
  );
});

type EscenarioTrazoProps = {
  puntos: TrazoMandala[];
  /** 0–1: tinta gastada. */
  tinta: SharedValue<number>;
  /** 0–1: qué tan cerca de un rayo pasa el dedo. */
  brilloRayos: SharedValue<number>;
  colorTinta: string;
  mostrarPista: boolean;
  /** Simetría radial, exclusiva de la mandala de Hábitos. Sin él, PLIEGUES_MANDALA (7). */
  pliegues?: number;
};

// El lienzo del acto 1, con el mismo lenguaje que el Sello del check:
// rayos guía, anillo de tinta, cintas blancas y puntas de luz. Sólo las
// cintas y las puntas se repintan con cada movimiento del dedo; lo demás
// está memorizado y se anima en el hilo de UI.
export function EscenarioTrazo({ brilloRayos, colorTinta, mostrarPista, pliegues = PLIEGUES_MANDALA, puntos, tinta }: EscenarioTrazoProps) {
  return (
    <View pointerEvents="none" style={styles.lienzo}>
      <Canvas pointerEvents="none" style={styles.lienzo}>
        <RayosGuia brillo={brilloRayos} pliegues={pliegues} />
        <AnilloTinta color={colorTinta} tinta={tinta} />
      </Canvas>
      {puntos.length > 1 && <CintasBlancas aura={colorTinta} pliegues={pliegues} trazos={puntos} />}
      {puntos.length > 0 && (
        <Canvas pointerEvents="none" style={styles.lienzo}>
          <PuntasDeLuz pliegues={pliegues} puntos={puntos} />
        </Canvas>
      )}
      {mostrarPista && puntos.length === 0 && <ManoFantasma pliegues={pliegues} />}
    </View>
  );
}

const styles = StyleSheet.create({
  lienzo: { height: LADO, left: 0, position: 'absolute', top: 0, width: LADO },
  mano: { left: 0, position: 'absolute', top: 0 },
});
