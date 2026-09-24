import { useEffect, useMemo, useRef, useState } from 'react';
import { BackHandler, Pressable, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useQueryClient } from '@tanstack/react-query';
import Svg, { Path } from 'react-native-svg';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { cancelAnimation, Easing, runOnJS, useAnimatedStyle, useSharedValue, withDelay, withRepeat, withTiming } from 'react-native-reanimated';
import { BlurMask, Canvas, Oval } from '@shopify/react-native-skia';

import { Texto } from '../../../../diseno';
import { useEscala } from '../../../../diseno/tema/MasterColorContext';
import { hapticSeguro } from '../../../../nucleo/dispositivo/haptics';
import { ANCHO_CINTA_MANDALA, ANGULO_REPOSO_MANDALA, coloresMandala, LADO_LIENZO_MANDALA, MandalaExtruido, RADIO_TRAZO_MANDALA } from '../../../habitos/componentes/MandalaExtruido';
import { ParticulasMandala, RafagaParticulas } from '../../../habitos/componentes/ParticulasMandala';
import { construirCaminosMandala } from '../../../habitos/mandalaGeometria';
import { guardarMandalaRegistro } from '../../../habitos/mandalaNodo.servicio';
import type { TrazoMandala } from '../../../habitos/mandalaNodo.tipos';
import { CAMARA_MAPA } from './camaraMapa';

/**
 * Centro de la mandala del pedestal y su lado, en coordenadas del viewport
 * del mapa ANTES de su proyección (sin inclinación, ya descontado el scroll).
 */
export type DestinoMapa = { x: number; y: number; tamano: number };

type Fase = 'trazando' | 'levitando' | 'descendiendo' | 'anclado';

const LADO = LADO_LIENZO_MANDALA;
const TOPE_LONGITUD = 1140; // 380 + 200%, mismo tope validado en el prototipo
const MIN_PUNTOS = 5;
const MIN_LONGITUD = 26;
const ESCALA_LEVITACION = 0.7;
const CONTEMPLACION_MS = 3600; // ~0,6 s de levitar + 3 s quieta en el aire
const DESCENSO_MS = 1400;
const ALTURA_ARCO = 36;
const LADO_RAFAGA = 140;

function distancia(a: TrazoMandala, b: TrazoMandala) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function longitudTrazo(puntos: TrazoMandala[]) {
  let total = 0;
  for (let i = 1; i < puntos.length; i += 1) total += distancia(puntos[i], puntos[i - 1]);
  return total;
}

function limitarAlAnillo(p: TrazoMandala): TrazoMandala {
  const d = Math.hypot(p.x, p.y);
  if (d <= RADIO_TRAZO_MANDALA) return p;
  const k = RADIO_TRAZO_MANDALA / d;
  return { x: p.x * k, y: p.y * k };
}

type CompositorOverlayProps = {
  color: string;
  paqueteId?: string | null;
  registroId: string;
  /** Dónde está la mandala del pedestal en el plano del mapa (ver NodoMandalaPedestal). */
  medirDestino: () => Promise<DestinoMapa | null>;
  /** La mandala tocó su pedestal: el mapa ya debe mostrarla con estos trazos. */
  onAnclado: (trazos: TrazoMandala[]) => void;
  /** El ritual se abandonó o no se pudo guardar: el pedestal queda pendiente. */
  onCancelado: () => void;
  onTerminado: () => void;
};

// Ritual de la mandala montado encima del mapa (fuera del viewport inclinado,
// así queda plano frente a la cámara), en cuatro actos:
//   1. trazando: velo ahumado, un solo gesto con simetría radial de 7.
//   2. levitando: el velo se disuelve, la mandala gana grosor, se achica a
//      0,7 y flota girando con su sombra lejos, abajo.
//   3. descendiendo: baja en arco hasta su pedestal, encogiéndose e
//      inclinándose al plano del mapa, y termina en la pose de reposo.
//   4. anclado: golpe háptico, destello en el suelo; la mandala real del
//      mapa ya está debajo en la misma pose, así que el overlay se va sin
//      que se note.
export function CompositorOverlay({ color, medirDestino, onAnclado, onCancelado, onTerminado, paqueteId, registroId }: CompositorOverlayProps) {
  const { t } = useTranslation();
  const esc = useEscala();
  const cliente = useQueryClient();

  const [fase, setFase] = useState<Fase>('trazando');
  const [puntos, setPuntos] = useState<TrazoMandala[]>([]);
  const [capeado, setCapeado] = useState(false);
  const [trazoFinal, setTrazoFinal] = useState<TrazoMandala[] | null>(null);
  const [destello, setDestello] = useState<{ x: number; y: number } | null>(null);
  const [dims, setDims] = useState({ alto: 0, ancho: 0 });

  const dimsRef = useRef(dims);
  const trazandoRef = useRef(false);
  const puntosRef = useRef<TrazoMandala[]>([]);
  const faseRef = useRef<Fase>('trazando');
  const montadoRef = useRef(true);
  const guardadoRef = useRef<Promise<boolean> | null>(null);
  const temporizadoresRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  const velo = useSharedValue(0);
  const textos = useSharedValue(0);
  const poema = useSharedValue(0);
  const sombra = useSharedValue(0);
  const salida = useSharedValue(1);
  const mandalaOpacidad = useSharedValue(1);
  const escala = useSharedValue(1);
  const escalaDestino = useSharedValue(ESCALA_LEVITACION);
  const flotar = useSharedValue(0);
  const progreso = useSharedValue(0);
  const dx = useSharedValue(0);
  const dy = useSharedValue(0);
  const giro = useSharedValue(0);
  const relieve = useSharedValue(0);
  const inclinacion = useSharedValue(0);
  const polvo = useSharedValue(0);
  const paleta = useMemo(() => coloresMandala(color, paqueteId), [color, paqueteId]);
  const destelloProgreso = useSharedValue(0);

  function cambiarFase(siguiente: Fase) {
    faseRef.current = siguiente;
    setFase(siguiente);
  }

  function programar(accion: () => void, ms: number) {
    temporizadoresRef.current.push(setTimeout(() => { if (montadoRef.current) accion(); }, ms));
  }

  useEffect(() => {
    montadoRef.current = true;
    velo.value = withTiming(1, { duration: 420, easing: Easing.out(Easing.quad) });
    textos.value = withDelay(120, withTiming(1, { duration: 420 }));
    return () => {
      montadoRef.current = false;
      temporizadoresRef.current.forEach(clearTimeout);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const suscripcion = BackHandler.addEventListener('hardwareBackPress', () => {
      if (faseRef.current === 'trazando') cancelar();
      return true;
    });
    return () => suscripcion.remove();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function salir(despues: () => void) {
    salida.value = withTiming(0, { duration: 350 }, (terminado) => {
      if (terminado) runOnJS(despues)();
    });
  }

  function cancelar() {
    trazandoRef.current = false;
    salir(onCancelado);
  }

  // ── Acto 1: el trazo ───────────────────────────────────────────────
  // Los eventos del gesto llegan en orden por runOnJS; el ref es la fuente
  // de verdad y el estado sólo repinta, así fijar() corre una sola vez.
  function actualizarPuntos(siguientes: TrazoMandala[]) {
    puntosRef.current = siguientes;
    setPuntos(siguientes);
  }

  function iniciarTrazo(x: number, y: number) {
    if (faseRef.current !== 'trazando') return;
    trazandoRef.current = true;
    setCapeado(false);
    actualizarPuntos([limitarAlAnillo({ x, y })]);
  }

  function agregarPunto(x: number, y: number) {
    if (!trazandoRef.current || faseRef.current !== 'trazando') return;
    const actuales = puntosRef.current;
    if (actuales.length === 0) return;
    const largoActual = longitudTrazo(actuales);
    if (largoActual >= TOPE_LONGITUD) return;
    const ultimo = actuales[actuales.length - 1];
    const siguiente = limitarAlAnillo({ x, y });
    const paso = distancia(ultimo, siguiente);
    if (largoActual + paso >= TOPE_LONGITUD) {
      const k = paso > 0 ? Math.max(0, TOPE_LONGITUD - largoActual) / paso : 0;
      setCapeado(true);
      actualizarPuntos([...actuales, { x: ultimo.x + (siguiente.x - ultimo.x) * k, y: ultimo.y + (siguiente.y - ultimo.y) * k }]);
      return;
    }
    actualizarPuntos([...actuales, siguiente]);
  }

  function finalizarTrazo() {
    if (!trazandoRef.current || faseRef.current !== 'trazando') return;
    trazandoRef.current = false;
    const actuales = puntosRef.current;
    // Trazo demasiado corto: se descarta, no queda una mandala a medias.
    if (actuales.length < MIN_PUNTOS || longitudTrazo(actuales) < MIN_LONGITUD) {
      actualizarPuntos([]);
      return;
    }
    fijar(actuales);
  }

  // ── Acto 2: la levitación ──────────────────────────────────────────
  function fijar(trazo: TrazoMandala[]) {
    hapticSeguro('confirmacion');
    setTrazoFinal(trazo);
    cambiarFase('levitando');
    // Se guarda en paralelo a la contemplación; el descenso lo espera.
    guardadoRef.current = guardarMandalaRegistro(registroId, trazo).then(() => true, () => false);

    velo.value = withTiming(0, { duration: 800, easing: Easing.out(Easing.quad) });
    textos.value = withTiming(0, { duration: 300 });
    escala.value = withTiming(ESCALA_LEVITACION, { duration: 900, easing: Easing.out(Easing.cubic) });
    relieve.value = withDelay(150, withTiming(1, { duration: 600, easing: Easing.out(Easing.cubic) }));
    // Se recuesta a su inclinación de pedestal mientras levita: así llega
    // al mapa ya en la misma pose que la mandala del nodo.
    inclinacion.value = withDelay(250, withTiming(1, { duration: 900, easing: Easing.inOut(Easing.cubic) }));
    polvo.value = withDelay(400, withTiming(1, { duration: 900 }));
    giro.value = withDelay(150, withRepeat(withTiming(360, { duration: 4200, easing: Easing.linear }), -1, false));
    flotar.value = withDelay(500, withRepeat(withTiming(1, { duration: 1600, easing: Easing.inOut(Easing.sin) }), -1, true));
    sombra.value = withDelay(300, withTiming(1, { duration: 700 }));
    poema.value = withDelay(700, withTiming(1, { duration: 700 }));

    programar(() => { void descender(trazo); }, CONTEMPLACION_MS);
  }

  // ── Acto 3: el descenso ────────────────────────────────────────────
  async function descender(trazo: TrazoMandala[]) {
    const guardado = await (guardadoRef.current ?? Promise.resolve(false));
    if (!montadoRef.current) return;
    if (!guardado) {
      // Sin guardar no hay aterrizaje: el pedestal sigue pendiente y el
      // ritual se retoma al tocarlo.
      salir(onCancelado);
      return;
    }

    const destino = await medirDestino();
    if (!montadoRef.current) return;
    if (!destino || destino.tamano <= 0) {
      onAnclado(trazo);
      cliente.invalidateQueries({ queryKey: ['habitos', 'mandalas'] });
      salir(onTerminado);
      return;
    }

    // El overlay ocupa la misma caja que el viewport del mapa, así que las
    // coordenadas del plano del mapa valen tal cual dentro de la capa-cámara.
    dx.value = destino.x - dimsRef.current.ancho / 2;
    dy.value = destino.y - dimsRef.current.alto / 2;
    escalaDestino.value = destino.tamano / LADO;
    setDestello({ x: destino.x, y: destino.y + destino.tamano * 0.45 });
    cambiarFase('descendiendo');

    poema.value = withTiming(0, { duration: 300 });
    // El flote queda congelado y se desvanece con el progreso del descenso.
    cancelAnimation(flotar);

    // Termina exactamente en la pose de reposo, con al menos casi una
    // vuelta de frenado para que el giro se sienta continuo.
    const actual = giro.value;
    cancelAnimation(giro);
    let giroFinal = ANGULO_REPOSO_MANDALA + 360 * Math.ceil((actual - ANGULO_REPOSO_MANDALA) / 360);
    if (giroFinal - actual < 300) giroFinal += 360;
    giro.value = withTiming(giroFinal, { duration: DESCENSO_MS, easing: Easing.out(Easing.cubic) });
    progreso.value = withTiming(1, { duration: DESCENSO_MS, easing: Easing.inOut(Easing.cubic) }, (terminado) => {
      if (terminado) runOnJS(anclar)(trazo);
    });
  }

  // ── Acto 4: el anclaje ─────────────────────────────────────────────
  function anclar(trazo: TrazoMandala[]) {
    hapticSeguro('impacto');
    cambiarFase('anclado');
    onAnclado(trazo);
    cliente.invalidateQueries({ queryKey: ['habitos', 'mandalas'] });
    destelloProgreso.value = withTiming(1, { duration: 800, easing: Easing.out(Easing.cubic) });
    // Un instante de superposición con la mandala real del mapa (misma pose,
    // mismo lugar) antes de irse, para que nunca quede un cuadro vacío.
    mandalaOpacidad.value = withDelay(140, withTiming(0, { duration: 160 }));
    programar(onTerminado, 860);
  }

  const gesto = Gesture.Pan()
    .onBegin((evento) => { runOnJS(iniciarTrazo)(evento.x - LADO / 2, evento.y - LADO / 2); })
    .onUpdate((evento) => { runOnJS(agregarPunto)(evento.x - LADO / 2, evento.y - LADO / 2); })
    .onEnd(() => { runOnJS(finalizarTrazo)(); });

  const estiloRaiz = useAnimatedStyle(() => ({ opacity: salida.value }));
  const estiloVelo = useAnimatedStyle(() => ({ opacity: velo.value }));
  const estiloTextos = useAnimatedStyle(() => ({ opacity: textos.value }));
  const estiloPoema = useAnimatedStyle(() => ({ opacity: poema.value, transform: [{ translateY: (1 - poema.value) * 8 }] }));

  // Capa-cámara: misma matriz y mismo origen que el viewport del mapa
  // (camaraMapa.ts), inclinándose a la par del descenso. La mandala viaja
  // dentro en coordenadas del plano del mapa; al llegar, ella y la del
  // pedestal pasan por la misma proyección y coinciden píxel a píxel.
  const estiloCamara = useAnimatedStyle(() => {
    const p = progreso.value;
    return {
      transform: [
        { perspective: CAMARA_MAPA.perspectiva },
        { rotateX: `${CAMARA_MAPA.inclinacionGrados * p}deg` },
        { scaleY: 1 - (1 - CAMARA_MAPA.escalaY) * p },
      ],
    };
  });

  const estiloMandala = useAnimatedStyle(() => {
    const p = progreso.value;
    const flote = -12 * flotar.value * (1 - p);
    const arco = -Math.sin(p * Math.PI) * ALTURA_ARCO;
    return {
      opacity: mandalaOpacidad.value,
      transform: [
        { translateX: dx.value * p },
        { translateY: dy.value * p + flote + arco },
        { scale: escala.value + (escalaDestino.value - escala.value) * p },
      ],
    };
  });

  // La sombra se achica y aclara cuando la mandala sube, como si se alejara
  // del suelo; durante el descenso se funde con la del pedestal.
  const estiloSombra = useAnimatedStyle(() => {
    const p = progreso.value;
    return {
      opacity: sombra.value * (0.55 - 0.2 * flotar.value) * (1 - p),
      transform: [{ translateX: dx.value * p }, { scale: (1 - 0.18 * flotar.value) * (1 - 0.6 * p) }],
    };
  });

  const estiloAnillo = useAnimatedStyle(() => ({
    opacity: destelloProgreso.value === 0 ? 0 : 0.9 * (1 - destelloProgreso.value),
    transform: [{ scale: 0.3 + destelloProgreso.value * 2.1 }],
  }));
  const estiloResplandor = useAnimatedStyle(() => ({
    opacity: destelloProgreso.value === 0 ? 0 : 0.55 * (1 - destelloProgreso.value),
    transform: [{ scale: 0.5 + destelloProgreso.value * 1.2 }],
  }));

  const caminos = construirCaminosMandala(puntos.length > 1 ? puntos : [{ x: 0, y: 0 }, { x: 0.01, y: 0 }], ANCHO_CINTA_MANDALA);
  const viewBox = `${-LADO / 2} ${-LADO / 2} ${LADO} ${LADO}`;
  const estado = capeado
    ? t('habitos.mandala.compositor.listoParaSoltar')
    : puntos.length > 0
      ? t('habitos.mandala.compositor.formando')
      : t('habitos.mandala.compositor.instruccion');
  const ySombra = Math.min(dims.alto / 2 + LADO * ESCALA_LEVITACION * 0.5 + 72, dims.alto - 110);

  return (
    <Animated.View
      onLayout={({ nativeEvent }) => {
        const siguiente = { alto: nativeEvent.layout.height, ancho: nativeEvent.layout.width };
        dimsRef.current = siguiente;
        setDims(siguiente);
      }}
      style={[StyleSheet.absoluteFill, styles.raiz, estiloRaiz]}
    >
      <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, styles.velo, estiloVelo]} />

      {dims.alto > 0 && (
        <Animated.View pointerEvents="none" style={[styles.sombra, { left: dims.ancho / 2 - 110, top: ySombra - 30 }, estiloSombra]}>
          <Canvas style={StyleSheet.absoluteFill}>
            <Oval color={esc.hoja.l22} height={22} width={150} x={35} y={19}>
              <BlurMask blur={12} style="normal" />
            </Oval>
          </Canvas>
        </Animated.View>
      )}

      <Animated.View pointerEvents="box-none" style={[StyleSheet.absoluteFill, styles.camara, estiloCamara]}>
        {destello && (
          <View pointerEvents="none" style={[styles.destello, { left: destello.x - 40, top: destello.y - 40 }]}>
            <Animated.View style={[styles.resplandor, { backgroundColor: color }, estiloResplandor]} />
            <Animated.View style={[styles.anillo, estiloAnillo]} />
            <View style={styles.rafaga}>
              <RafagaParticulas progreso={destelloProgreso} tamano={LADO_RAFAGA} />
            </View>
          </View>
        )}

        {dims.alto > 0 && (
          <Animated.View style={[styles.lienzo, { left: (dims.ancho - LADO) / 2, top: (dims.alto - LADO) / 2 }, estiloMandala]}>
            {fase === 'trazando' || !trazoFinal ? (
              <GestureDetector gesture={gesto}>
                <View style={styles.superficie}>
                  <Animated.View style={[styles.guia, { borderColor: color }, estiloTextos]} />
                  <Svg height={LADO} pointerEvents="none" style={StyleSheet.absoluteFill} viewBox={viewBox} width={LADO}>
                    {puntos.length > 1 && caminos.map((d, indice) => (d
                      ? <Path d={d} fill={paleta.cara} key={indice} stroke={paleta.filo} strokeLinejoin="round" strokeOpacity={0.75} strokeWidth={4} />
                      : null))}
                  </Svg>
                </View>
              </GestureDetector>
            ) : (
              <>
                <MandalaExtruido color={color} giro={giro} paqueteId={paqueteId} inclinacion={inclinacion} relieve={relieve} tamano={LADO} trazos={trazoFinal} />
                <ParticulasMandala cantidad={18} escalaPunto={2.6} intensidad={1} tamano={LADO} visibilidad={polvo} />
              </>
            )}
          </Animated.View>
        )}
      </Animated.View>

      <Animated.View pointerEvents="none" style={[styles.cabecera, estiloTextos]}>
        <Texto style={styles.titulo}>{t('habitos.mandala.compositor.titulo')}</Texto>
      </Animated.View>

      <Animated.View pointerEvents={fase === 'trazando' ? 'box-none' : 'none'} style={[styles.pie, estiloTextos]}>
        <Texto style={styles.estado}>{estado}</Texto>
        <Pressable accessibilityRole="button" hitSlop={12} onPress={cancelar}>
          <Texto style={styles.masTarde}>{t('habitos.mandala.ritual.masTarde')}</Texto>
        </Pressable>
      </Animated.View>

      <Animated.View pointerEvents="none" style={[styles.poema, estiloPoema]}>
        <View style={styles.poemaPildora}>
          <Texto style={[styles.poemaTexto, { color: esc.hoja.l22 }]}>{t('habitos.mandala.ritual.contemplacion')}</Texto>
        </View>
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  raiz: { elevation: 100, zIndex: 100 },
  velo: { backgroundColor: 'rgba(7, 16, 12, 0.82)' },
  lienzo: { height: LADO, position: 'absolute', width: LADO },
  superficie: { alignItems: 'center', height: LADO, justifyContent: 'center', width: LADO },
  guia: { borderRadius: LADO / 2, borderWidth: 1.5, height: LADO * 0.94, opacity: 0.4, position: 'absolute', width: LADO * 0.94 },
  sombra: { height: 60, position: 'absolute', width: 220 },
  camara: { transformOrigin: CAMARA_MAPA.origen },
  destello: { alignItems: 'center', height: 80, justifyContent: 'center', position: 'absolute', transform: [{ scaleY: 0.38 }], width: 80 },
  anillo: { borderColor: '#FFFFFF', borderRadius: 40, borderWidth: 3, height: 80, position: 'absolute', width: 80 },
  resplandor: { borderRadius: 40, height: 80, position: 'absolute', width: 80 },
  // Dentro de `destello` (achatado 0,38): la ráfaga se abre sobre el suelo.
  rafaga: { height: LADO_RAFAGA, position: 'absolute', transform: [{ scaleY: 1 / 0.38 }], width: LADO_RAFAGA },
  cabecera: { alignItems: 'center', left: 24, position: 'absolute', right: 24, top: 28 },
  titulo: { color: '#FFFFFF', fontFamily: 'MontserratAlternates-Bold', fontSize: 18, textAlign: 'center' },
  pie: { alignItems: 'center', bottom: 28, gap: 14, left: 24, position: 'absolute', right: 24 },
  estado: { color: 'rgba(255, 255, 255, 0.78)', fontFamily: 'Montserrat-Medium', fontSize: 13, textAlign: 'center' },
  masTarde: { color: 'rgba(255, 255, 255, 0.55)', fontFamily: 'Montserrat-SemiBold', fontSize: 13 },
  poema: { alignItems: 'center', bottom: 40, left: 24, position: 'absolute', right: 24 },
  poemaPildora: { backgroundColor: 'rgba(255, 255, 255, 0.78)', borderRadius: 20, paddingHorizontal: 18, paddingVertical: 9 },
  poemaTexto: { fontFamily: 'MontserratAlternates-Bold', fontSize: 15, textAlign: 'center' },
});
