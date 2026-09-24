import { type ReactNode, useMemo, useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  cancelAnimation, Easing, Extrapolation, interpolate, runOnJS, type SharedValue,
  useAnimatedReaction, useAnimatedStyle, useDerivedValue, useSharedValue, withDelay, withTiming,
} from 'react-native-reanimated';
import { BlurMask, Canvas, Circle, DashPathEffect, Group, Path, Skia, type SkPath } from '@shopify/react-native-skia';

import { hapticSeguro } from '../../../../nucleo/dispositivo/haptics';
import { useEscala } from '../../../../diseno/tema/MasterColorContext';
import { ParticulasMandala } from '../../../habitos/componentes/ParticulasMandala';
import {
  ACTOS_SELLO, type CapaSello, DURACION_SELLO_MS, FACTOR_RETROCESO, generarGeometriaSello, giroSello,
  type OrbitasSello, pulsosSello, seg, ventanaCapa,
} from './selloCoreografia';

const DURACION_CLIMAX_MS = 750;
const RETRASO_ASCENSO_MS = 650;
const DURACION_ASCENSO_MS = 750;
const MOTAS_ESTALLIDO = 18;
const PARTICULAS_POLVO = 26;

const ENCENDIDO_FIN = ACTOS_SELLO.encendido[1];
// Márgenes en fracción de progreso, precalculados: dentro de un worklet no
// se puede llamar a seg() (corre en el hilo de UI).
const INICIO_CIRCULO = seg(0.1);
const APARICION_ORBITAS = seg(0.8);
const CHISPA_ANTES = seg(0.1);
const CHISPA_DESPUES = seg(0.45);
const [RESONANCIA_INI, RESONANCIA_FIN] = ACTOS_SELLO.resonancia;
const [CONVERGENCIA_INI, CONVERGENCIA_FIN] = ACTOS_SELLO.convergencia;

// ─── Hook: carga, pulsos hápticos y clímax ───────────────────────────────

type OpcionesSello = {
  semilla: string;
  /** Se llega al 100 %: registrar el día. */
  onCompleto: () => void;
  /** Terminó el clímax (el punto de luz ya se fue): recién ahí salir. */
  onClimaxTerminado: () => void;
};

export function useSelloMantener({ onClimaxTerminado, onCompleto, semilla }: OpcionesSello) {
  const progreso = useSharedValue(0);
  const sello = useSharedValue(0);
  const ascenso = useSharedValue(0);
  const completoRef = useRef(false);
  const totalCapas = useMemo(() => generarGeometriaSello(semilla).capas.length, [semilla]);
  const pulsos = useMemo(() => pulsosSello(totalCapas), [totalCapas]);
  const momentos = useMemo(() => pulsos.map((pulso) => pulso.en), [pulsos]);

  function pulsar(indice: number) {
    hapticSeguro(pulsos[indice]?.tipo ?? 'seleccion');
  }

  // Sólo mientras carga (el progreso sube): al retroceder, silencio.
  useAnimatedReaction(() => progreso.value, (actual, previo) => {
    if (previo === null || actual <= previo) return;
    for (let i = 0; i < momentos.length; i += 1) {
      if (momentos[i] > previo && momentos[i] <= actual) runOnJS(pulsar)(i);
    }
  }, [momentos]);

  function completar() {
    if (completoRef.current) return;
    completoRef.current = true;
    hapticSeguro('impacto');
    sello.value = withTiming(1, { duration: DURACION_CLIMAX_MS, easing: Easing.out(Easing.cubic) });
    ascenso.value = withDelay(RETRASO_ASCENSO_MS, withTiming(1, { duration: DURACION_ASCENSO_MS, easing: Easing.in(Easing.cubic) }, (terminado) => {
      if (terminado) runOnJS(onClimaxTerminado)();
    }));
    onCompleto();
  }

  function cargarHasta(duracion: number) {
    progreso.value = withTiming(1, { duration: duracion, easing: Easing.linear }, (terminado) => {
      if (terminado) runOnJS(completar)();
    });
  }

  return {
    ascenso,
    progreso,
    sello,
    /** Dedo apoyado: continúa desde donde iba. */
    iniciar() {
      if (completoRef.current) return;
      cargarHasta((1 - progreso.value) * DURACION_SELLO_MS);
    },
    /** Dedo levantado: retrocede despacio, no vuelve a cero de golpe. */
    soltar() {
      if (completoRef.current) return;
      const actual = progreso.value;
      cancelAnimation(progreso);
      progreso.value = withTiming(0, { duration: actual * DURACION_SELLO_MS * FACTOR_RETROCESO, easing: Easing.out(Easing.quad) });
    },
    /** El registro falló: el sello vuelve a su estado inicial para reintentar. */
    reiniciar() {
      completoRef.current = false;
      cancelAnimation(progreso);
      cancelAnimation(sello);
      cancelAnimation(ascenso);
      progreso.value = 0;
      sello.value = 0;
      ascenso.value = 0;
    },
    /** Alternativa accesible: recorre el resto de la carga rápido y sella igual. */
    completarAhora() {
      if (completoRef.current) return;
      cancelAnimation(progreso);
      cargarHasta(600);
    },
  };
}

// ─── Visual ──────────────────────────────────────────────────────────────

function anguloVertice(capa: CapaSello, i: number) {
  return capa.rotInicial + (i * Math.PI * 2) / capa.lados - Math.PI / 2;
}

function pathCapa(cx: number, cy: number, radio: number, capa: CapaSello): SkPath {
  const path = Skia.Path.Make();
  if (capa.forma === 'circulo') { path.addCircle(cx, cy, radio); return path; }
  if (capa.forma === 'roseta') {
    // Cada pétalo es un círculo de medio radio que pasa por el centro.
    for (let i = 0; i < capa.lados; i += 1) {
      const a = anguloVertice(capa, i);
      path.addCircle(cx + (radio / 2) * Math.cos(a), cy + (radio / 2) * Math.sin(a), radio / 2);
    }
    return path;
  }
  // Polígono (salto 1) o estrella {lados/salto}: un solo trazo cerrado.
  for (let k = 0; k <= capa.lados; k += 1) {
    const a = anguloVertice(capa, (k * capa.salto) % capa.lados);
    const x = cx + radio * Math.cos(a);
    const y = cy + radio * Math.sin(a);
    if (k === 0) path.moveTo(x, y); else path.lineTo(x, y);
  }
  path.close();
  return path;
}

// Puntos donde destella la figura al cerrarse: sus vértices, o la punta
// exterior de cada pétalo.
function verticesCapa(cx: number, cy: number, radio: number, capa: CapaSello) {
  if (capa.forma === 'circulo') return [];
  return Array.from({ length: capa.lados }, (_, i) => {
    const a = anguloVertice(capa, i);
    return { x: cx + radio * Math.cos(a), y: cy + radio * Math.sin(a) };
  });
}

// La red de la resonancia: estrella interna (i → i+2) en polígonos de 5+
// lados, radios al centro en el resto; círculos y rosetas no llevan red.
function pathRed(cx: number, cy: number, radio: number, capa: CapaSello): SkPath | null {
  if (capa.forma === 'circulo' || capa.forma === 'roseta') return null;
  const path = Skia.Path.Make();
  const vertices = verticesCapa(cx, cy, radio, capa);
  if (capa.forma === 'poligono' && capa.lados >= 5) {
    vertices.forEach((v, i) => { const w = vertices[(i + 2) % vertices.length]; path.moveTo(v.x, v.y); path.lineTo(w.x, w.y); });
  } else {
    vertices.forEach((v) => { path.moveTo(cx, cy); path.lineTo(v.x, v.y); });
  }
  return path;
}

type SelloCargaInteractivaProps = {
  semilla: string;
  tamano: number;
  progreso: SharedValue<number>;
  sello: SharedValue<number>;
  ascenso: SharedValue<number>;
  children?: ReactNode;
};

// Los colores salen de la escala del tema del paquete (useEscala, dentro de
// TonoDelHabito): la misma escala de la UI rotada al matiz del paquete. Sus
// familias ya son vecinas entre sí (lima tira al amarillo, menta al
// turquesa), así que rotadas dan una paleta análoga del paquete — Mathist
// sale de azul a magenta — coherente con el resto de la app.
export function SelloCargaInteractiva({ ascenso, children, progreso, sello, semilla, tamano }: SelloCargaInteractivaProps) {
  // Lienzo más grande que la caja: las órbitas y el estallido se salen.
  const lado = tamano * 1.6;
  const c = lado / 2;
  const R = tamano * 0.33;
  const esc = useEscala();
  // Tonos luminosos para las figuras (brillan sobre la penumbra) y uno
  // profundo y saturado para los halos.
  const paleta = useMemo(() => ({
    circulo: esc.jade.l87,
    halo: esc.jade.l59a,
    orbitas: esc.hoja.l89,
    resplandor: esc.jade.l52,
    tonos: [esc.hoja.l82, esc.lima.l83, esc.menta.l76, esc.jade.l87, esc.hoja.l77a],
  }), [esc]);
  const tonos = paleta.tonos;
  const { capas, orbitas } = useMemo(() => generarGeometriaSello(semilla), [semilla]);
  const figuras = useMemo(() => capas.map((capa, i) => ({
    capa,
    color: tonos[i % tonos.length],
    path: pathCapa(c, c, R * capa.radio, capa),
    red: pathRed(c, c, R * capa.radio, capa),
    vertices: verticesCapa(c, c, R * capa.radio, capa),
    ventana: ventanaCapa(i, capas.length),
  })), [R, c, capas, tonos]);
  const circuloEncendido = useMemo(() => { const p = Skia.Path.Make(); p.addCircle(c, c, R * 1.08); return p; }, [R, c]);
  const motas = useMemo(() => Array.from({ length: MOTAS_ESTALLIDO }, (_, i) => ({
    angulo: (i / MOTAS_ESTALLIDO) * Math.PI * 2 + (i % 3) * 0.13,
    alcance: 1.1 + ((i * 7) % 5) * 0.12,
    radio: 1.4 + ((i * 5) % 4) * 0.6,
  })), []);

  // Tensión: respira hasta la convergencia, se contrae, y el sello la suelta.
  const escala = useDerivedValue(() => {
    const base = interpolate(progreso.value, [0, ENCENDIDO_FIN, CONVERGENCIA_INI, CONVERGENCIA_FIN, 1], [0.9, 1, 1, 0.88, 0.86], Extrapolation.CLAMP);
    return base + interpolate(sello.value, [0, 0.25, 1], [0, 0.18, 0.1], Extrapolation.CLAMP);
  });
  const halo = useDerivedValue(() => interpolate(progreso.value, [0, ENCENDIDO_FIN, CONVERGENCIA_INI, 1], [0, 0.28, 0.38, 0.6], Extrapolation.CLAMP) * (1 - sello.value * 0.6));
  const finEncendido = useDerivedValue(() => interpolate(progreso.value, [INICIO_CIRCULO, ENCENDIDO_FIN], [0, 1], Extrapolation.CLAMP));
  const nucleo = useDerivedValue(() => 3 + progreso.value * 7 + sello.value * 6);
  const opacidadOrbitas = useDerivedValue(() => interpolate(progreso.value, [RESONANCIA_INI, RESONANCIA_INI + APARICION_ORBITAS], [0, 0.7], Extrapolation.CLAMP) * (1 - sello.value));
  // En la convergencia las órbitas caen en espiral hacia el centro.
  const escalaOrbitas = useDerivedValue(() => interpolate(progreso.value, [CONVERGENCIA_INI, CONVERGENCIA_FIN], [1, 0.55], Extrapolation.CLAMP));
  const onda = useDerivedValue(() => R * (0.5 + sello.value * 1.4));
  const anchoOnda = useDerivedValue(() => 4 * (1 - sello.value));
  const opacidadOnda = useDerivedValue(() => (sello.value === 0 ? 0 : 0.9 * (1 - sello.value)));
  const destello = useDerivedValue(() => interpolate(sello.value, [0, 0.08, 0.5], [0, 0.85, 0], Extrapolation.CLAMP));
  const transformGlobal = useDerivedValue(() => [{ scale: escala.value }]);
  // Polvo de luz blanco: aparece con la penumbra y se intensifica hacia el
  // sello; tras el estallido se apaga con el punto de luz.
  const polvo = useDerivedValue(() => interpolate(progreso.value, [0, ENCENDIDO_FIN, RESONANCIA_INI, CONVERGENCIA_FIN], [0, 0.45, 0.75, 1], Extrapolation.CLAMP) * (1 - ascenso.value));

  // El punto de luz final: todo se comprime y sube fuera de la pantalla.
  const estiloAscenso = useAnimatedStyle(() => ({
    opacity: 1 - ascenso.value * ascenso.value,
    transform: [{ translateY: -ascenso.value * tamano * 1.8 }, { scale: 1 - ascenso.value * 0.88 }],
  }));

  return (
    <Animated.View style={[{ height: tamano, width: tamano }, estiloAscenso]}>
      <View pointerEvents="none" style={[styles.lienzo, { height: lado, left: -(lado - tamano) / 2, top: -(lado - tamano) / 2, width: lado }]}>
        <ParticulasMandala cantidad={PARTICULAS_POLVO} escalaPunto={1.5} intensidad={1} tamano={lado} visibilidad={polvo} />
      </View>
      <Canvas pointerEvents="none" style={[styles.lienzo, { height: lado, left: -(lado - tamano) / 2, top: -(lado - tamano) / 2, width: lado }]}>
        <Group opacity={halo}>
          <Circle color={paleta.halo} cx={c} cy={c} r={R * 1.15}>
            <BlurMask blur={R * 0.5} style="normal" />
          </Circle>
        </Group>

        <Group origin={{ x: c, y: c }} transform={transformGlobal}>
          <Path color={paleta.circulo} end={finEncendido} path={circuloEncendido} strokeWidth={1.5} style="stroke" opacity={0.85} />
          <Orbitas c={c} color={paleta.orbitas} escala={escalaOrbitas} opacidad={opacidadOrbitas} orbitas={orbitas} progreso={progreso} R={R} />
          {figuras.map((figura, indice) => (
            <Figura c={c} canto={paleta.resplandor} figura={figura} key={indice} progreso={progreso} />
          ))}
          <Circle color="#FFFFFF" cx={c} cy={c} r={nucleo}>
            <BlurMask blur={6} style="solid" />
          </Circle>
        </Group>

        <Circle color="#FFFFFF" cx={c} cy={c} opacity={opacidadOnda} r={onda} strokeWidth={anchoOnda} style="stroke" />
        {motas.map((mota, indice) => (
          <MotaEstallido c={c} key={indice} mota={mota} R={R} sello={sello} />
        ))}
        <Group opacity={destello}>
          <Circle color="#FFFFFF" cx={c} cy={c} r={R * 0.9}>
            <BlurMask blur={R * 0.6} style="normal" />
          </Circle>
        </Group>
      </Canvas>
      <View pointerEvents="none" style={[StyleSheet.absoluteFill, styles.centro]}>{children}</View>
    </Animated.View>
  );
}

type FiguraSello = { capa: CapaSello; color: string; path: SkPath; red: SkPath | null; vertices: { x: number; y: number }[]; ventana: [number, number] };

function Figura({ c, canto, figura, progreso }: { c: number; canto: string; figura: FiguraSello; progreso: SharedValue<number> }) {
  const [inicio, fin] = figura.ventana;
  const trazo = useDerivedValue(() => interpolate(progreso.value, [inicio, fin], [0, 1], Extrapolation.CLAMP));
  const transform = useDerivedValue(() => [{ rotate: giroSello(progreso.value) * figura.capa.velocidad }]);
  // Destello en los vértices justo cuando la figura se cierra.
  const chispa = useDerivedValue(() => interpolate(progreso.value, [fin - CHISPA_ANTES, fin, fin + CHISPA_DESPUES], [0, 1, 0], Extrapolation.CLAMP));
  const finRed = useDerivedValue(() => interpolate(progreso.value, [RESONANCIA_INI, RESONANCIA_FIN], [0, 1], Extrapolation.CLAMP));

  return (
    <Group origin={{ x: c, y: c }} transform={transform}>
      {/* Anticipo tenue de la figura, visible aún sobre el fondo claro. */}
      <Path color={canto} opacity={0.18} path={figura.path} strokeJoin="round" strokeWidth={1.5} style="stroke" />
      {figura.red && <Path color={figura.color} end={finRed} opacity={0.45} path={figura.red} strokeWidth={1} style="stroke" />}
      <Path color={canto} end={trazo} opacity={0.5} path={figura.path} strokeJoin="round" strokeWidth={7} style="stroke">
        <BlurMask blur={5} style="normal" />
      </Path>
      <Path color={figura.color} end={trazo} path={figura.path} strokeCap="round" strokeJoin="round" strokeWidth={3} style="stroke" />
      <Group opacity={chispa}>
        {figura.vertices.map((v, i) => (
          <Circle color="#FFFFFF" cx={v.x} cy={v.y} key={i} r={4}>
            <BlurMask blur={3} style="solid" />
          </Circle>
        ))}
      </Group>
    </Group>
  );
}

function Orbitas({ c, color, escala, opacidad, orbitas, progreso, R }: { c: number; color: string; escala: SharedValue<number>; opacidad: SharedValue<number>; orbitas: OrbitasSello; progreso: SharedValue<number>; R: number }) {
  const t1 = useDerivedValue(() => [{ scale: escala.value }, { rotate: giroSello(progreso.value) * orbitas.v1 + progreso.value * 2 }]);
  const t2 = useDerivedValue(() => [{ scale: escala.value }, { rotate: giroSello(progreso.value) * orbitas.v2 - progreso.value * 2 }]);
  return (
    <Group opacity={opacidad}>
      <Group origin={{ x: c, y: c }} transform={t1}>
        <Circle color={color} cx={c} cy={c} r={R * orbitas.r1} strokeCap="round" strokeWidth={3} style="stroke">
          <DashPathEffect intervals={[2, orbitas.guion1]} />
        </Circle>
      </Group>
      <Group origin={{ x: c, y: c }} transform={t2}>
        <Circle color={color} cx={c} cy={c} r={R * orbitas.r2} strokeCap="round" strokeWidth={2} style="stroke">
          <DashPathEffect intervals={[2, orbitas.guion2]} />
        </Circle>
      </Group>
    </Group>
  );
}

function MotaEstallido({ c, mota, R, sello }: { c: number; mota: { angulo: number; alcance: number; radio: number }; R: number; sello: SharedValue<number> }) {
  const cx = useDerivedValue(() => c + Math.cos(mota.angulo) * R * (0.3 + sello.value * mota.alcance));
  const cy = useDerivedValue(() => c + Math.sin(mota.angulo) * R * (0.3 + sello.value * mota.alcance));
  const opacidad = useDerivedValue(() => (sello.value === 0 ? 0 : 1 - sello.value));
  return <Circle color="#FFFFFF" cx={cx} cy={cy} opacity={opacidad} r={mota.radio} />;
}

const styles = StyleSheet.create({
  lienzo: { position: 'absolute' },
  centro: { alignItems: 'center', justifyContent: 'center' },
});
