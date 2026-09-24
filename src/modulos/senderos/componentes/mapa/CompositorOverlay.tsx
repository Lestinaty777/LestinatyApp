import { useEffect, useMemo, useRef, useState } from 'react';
import { BackHandler, Pressable, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useQueryClient } from '@tanstack/react-query';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { cancelAnimation, Easing, interpolate, runOnJS, useAnimatedStyle, useSharedValue, withDelay, withRepeat, withTiming } from 'react-native-reanimated';
import { BlurMask, Canvas, Oval } from '@shopify/react-native-skia';

import { Texto } from '../../../../diseno';
import { useEscala } from '../../../../diseno/tema/MasterColorContext';
import { hapticSeguro } from '../../../../nucleo/dispositivo/haptics';
import { LADO_LIENZO_MANDALA, RADIO_TRAZO_MANDALA } from '../../../habitos/componentes/MandalaExtruido';
import { ParticulasMandala } from '../../../habitos/componentes/ParticulasMandala';
import { PLIEGUES_MANDALA } from '../../../habitos/mandalaGeometria';
import { guardarMandalaRegistro } from '../../../habitos/mandalaNodo.servicio';
import type { TrazoMandala } from '../../../habitos/mandalaNodo.tipos';
import { haVistoPistaTrazoMandala, marcarPistaTrazoMandalaVista } from '../../../habitos/pistaTrazoMandala';
import { CAMARA_MAPA } from './camaraMapa';
import { CintasBlancas, EscenarioTrazo } from './EscenarioTrazo';

/**
 * Centro de la mandala del pedestal y su lado, en coordenadas del viewport
 * del mapa ANTES de su proyección (sin inclinación, ya descontado el scroll).
 */
export type DestinoMapa = { x: number; y: number; tamano: number };

type Fase = 'trazando' | 'levitando' | 'descendiendo' | 'fundiendo';

const LADO = LADO_LIENZO_MANDALA;
const TOPE_LONGITUD = 1140; // 380 + 200%, mismo tope validado en el prototipo
const MIN_PUNTOS = 5;
const MIN_LONGITUD = 26;
const ESCALA_LEVITACION = 0.7;
const CONTEMPLACION_MS = 3600; // ~0,6 s de levitar + 3 s quieta en el aire
const DESCENSO_MS = 1400;
const FUSION_MS = 560;
const ALTURA_ARCO = 36;
// La mandala blanca llega al pedestal un poco más chica que la de nácar.
const PROPORCION_LLEGADA = 0.85;
// El velo se retira por etapas: la mandala blanca se sigue leyendo en el
// aire y el nácar emerge ya a plena luz.
const VELO_TRAZO = 1;
const VELO_LEVITACION = 0.6;
const VELO_DESCENSO = 0.36;

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

// Qué tan cerca de un rayo guía pasa el dedo: 1 encima, 0 a medio camino.
function cercaniaRayo(p: TrazoMandala) {
  const sector = (Math.PI * 2) / PLIEGUES_MANDALA;
  const angulo = ((Math.atan2(p.y, p.x) % sector) + sector) % sector;
  const d = Math.min(angulo, sector - angulo);
  return Math.max(0, 1 - d / (sector / 2));
}

type CompositorOverlayProps = {
  color: string;
  registroId: string;
  /** Dónde está la mandala del pedestal en el plano del mapa (ver NodoMandalaPedestal). */
  medirDestino: () => Promise<DestinoMapa | null>;
  /** La mandala blanca se fundió en el pedestal: el mapa hace emerger la de nácar con estos trazos. */
  onAnclado: (trazos: TrazoMandala[]) => void;
  /** El ritual se abandonó o no se pudo guardar: el pedestal queda pendiente. */
  onCancelado: () => void;
  onTerminado: () => void;
};

// Ritual de la mandala montado encima del mapa (fuera del viewport inclinado,
// así queda plano frente a la cámara), en cuatro actos:
//   1. trazando: el escenario del Sello — penumbra, polvo de luz, rayos guía,
//      anillo de tinta y puntas de luz; la mandala se traza en blanco.
//   2. levitando: el velo se retira a medias, la mandala blanca se achica y
//      flota girando despacio, con su sombra lejos, abajo.
//   3. descendiendo: baja en arco hasta su pedestal por la capa-cámara del
//      mapa (misma proyección que el viewport).
//   4. fundiendo: se hunde y se aplana en el pedestal, que se enciende; ahí
//      el mapa hace emerger la mandala de nácar (NodoMandalaPedestal).
export function CompositorOverlay({ color, medirDestino, onAnclado, onCancelado, onTerminado, registroId }: CompositorOverlayProps) {
  const { t } = useTranslation();
  const esc = useEscala();
  const cliente = useQueryClient();
  const aura = esc.jade.l70;

  const [fase, setFase] = useState<Fase>('trazando');
  const [puntos, setPuntos] = useState<TrazoMandala[]>([]);
  const [trazoFinal, setTrazoFinal] = useState<TrazoMandala[] | null>(null);
  const [charco, setCharco] = useState<{ x: number; y: number; ancho: number } | null>(null);
  const [dims, setDims] = useState({ alto: 0, ancho: 0 });
  const [mostrarPista, setMostrarPista] = useState(false);

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
  const polvo = useSharedValue(0);
  const tinta = useSharedValue(0);
  const brilloRayos = useSharedValue(0);
  const escala = useSharedValue(1);
  const escalaDestino = useSharedValue(ESCALA_LEVITACION);
  const flotar = useSharedValue(0);
  const rotacion = useSharedValue(0);
  const progreso = useSharedValue(0);
  const fusion = useSharedValue(0);
  const dx = useSharedValue(0);
  const dy = useSharedValue(0);

  function cambiarFase(siguiente: Fase) {
    faseRef.current = siguiente;
    setFase(siguiente);
  }

  function programar(accion: () => void, ms: number) {
    temporizadoresRef.current.push(setTimeout(() => { if (montadoRef.current) accion(); }, ms));
  }

  useEffect(() => {
    montadoRef.current = true;
    velo.value = withTiming(VELO_TRAZO, { duration: 420, easing: Easing.out(Easing.quad) });
    textos.value = withDelay(120, withTiming(1, { duration: 420 }));
    polvo.value = withDelay(200, withTiming(1, { duration: 900 }));
    haVistoPistaTrazoMandala().then((vista) => { if (!vista && montadoRef.current && puntosRef.current.length === 0) setMostrarPista(true); }, () => undefined);
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
    tinta.value = Math.min(1, longitudTrazo(siguientes) / TOPE_LONGITUD);
    const ultimo = siguientes[siguientes.length - 1];
    brilloRayos.value = ultimo ? cercaniaRayo(ultimo) : 0;
  }

  function iniciarTrazo(x: number, y: number) {
    if (faseRef.current !== 'trazando') return;
    trazandoRef.current = true;
    if (mostrarPista) {
      setMostrarPista(false);
      void marcarPistaTrazoMandalaVista().catch(() => undefined);
    }
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
      // Se acabó la tinta: un toque avisa que ya se puede soltar.
      const k = paso > 0 ? Math.max(0, TOPE_LONGITUD - largoActual) / paso : 0;
      hapticSeguro('accion');
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

    velo.value = withTiming(VELO_LEVITACION, { duration: 800, easing: Easing.out(Easing.quad) });
    textos.value = withTiming(0, { duration: 300 });
    polvo.value = withTiming(0.55, { duration: 900 });
    escala.value = withTiming(ESCALA_LEVITACION, { duration: 900, easing: Easing.out(Easing.cubic) });
    rotacion.value = withRepeat(withTiming(360, { duration: 24000, easing: Easing.linear }), -1, false);
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
    // La mandala blanca va al tope del pedestal (la base de la de nácar).
    const baseY = destino.y + destino.tamano * 0.45;
    dx.value = destino.x - dimsRef.current.ancho / 2;
    dy.value = baseY - dimsRef.current.alto / 2;
    escalaDestino.value = (destino.tamano * PROPORCION_LLEGADA) / LADO;
    setCharco({ ancho: destino.tamano * 1.1, x: destino.x, y: baseY });
    cambiarFase('descendiendo');

    poema.value = withTiming(0, { duration: 300 });
    polvo.value = withTiming(0, { duration: 700 });
    velo.value = withTiming(VELO_DESCENSO, { duration: DESCENSO_MS });
    // El flote queda congelado y se desvanece con el progreso del descenso.
    cancelAnimation(flotar);
    progreso.value = withTiming(1, { duration: DESCENSO_MS, easing: Easing.inOut(Easing.cubic) }, (terminado) => {
      if (terminado) runOnJS(fundir)(trazo);
    });
  }

  // ── Acto 4: la fusión ──────────────────────────────────────────────
  function fundir(trazo: TrazoMandala[]) {
    hapticSeguro('confirmacion');
    cambiarFase('fundiendo');
    velo.value = withTiming(0, { duration: FUSION_MS + 300 });
    fusion.value = withTiming(1, { duration: FUSION_MS, easing: Easing.in(Easing.cubic) }, (terminado) => {
      if (terminado) runOnJS(emerger)(trazo);
    });
  }

  function emerger(trazo: TrazoMandala[]) {
    // El pedestal ya brilla: desde aquí la mandala de nácar sube (el mapa).
    onAnclado(trazo);
    cliente.invalidateQueries({ queryKey: ['habitos', 'mandalas'] });
    programar(() => salir(onTerminado), 420);
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
  // (camaraMapa.ts), inclinándose a la par del descenso: la mandala viaja
  // dentro en coordenadas del plano del mapa y llega al pedestal exacto.
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

  // Al fundirse se hunde un poco, se aplana contra el pedestal y se apaga.
  const estiloMandala = useAnimatedStyle(() => {
    const p = progreso.value;
    const f = fusion.value;
    const flote = -12 * flotar.value * (1 - p);
    const arco = -Math.sin(p * Math.PI) * ALTURA_ARCO;
    return {
      opacity: 1 - f,
      transform: [
        { translateX: dx.value * p },
        { translateY: dy.value * p + flote + arco + f * 6 },
        { scale: escala.value + (escalaDestino.value - escala.value) * p },
        { scaleY: 1 - 0.85 * f },
        { rotate: `${rotacion.value}deg` },
      ],
    };
  });

  const estiloSombra = useAnimatedStyle(() => {
    const p = progreso.value;
    return {
      opacity: sombra.value * (0.55 - 0.2 * flotar.value) * (1 - p),
      transform: [{ translateX: dx.value * p }, { scale: (1 - 0.18 * flotar.value) * (1 - 0.6 * p) }],
    };
  });

  // El tope del pedestal se enciende mientras la mandala se funde en él.
  const estiloCharco = useAnimatedStyle(() => ({
    opacity: interpolate(fusion.value, [0, 0.7, 1], [0, 1, 0.85]),
    transform: [{ scaleX: 0.6 + fusion.value * 0.4 }],
  }));

  const ySombra = Math.min(dims.alto / 2 + LADO * ESCALA_LEVITACION * 0.5 + 72, dims.alto - 110);
  const ladoPolvo = Math.max(dims.alto, dims.ancho);
  // Memorizado: el polvo no debe repintarse con cada movimiento del dedo.
  const capaPolvo = useMemo(() => (ladoPolvo > 0 ? (
    <View pointerEvents="none" style={[styles.polvo, { height: ladoPolvo, left: (dims.ancho - ladoPolvo) / 2, top: (dims.alto - ladoPolvo) / 2, width: ladoPolvo }]}>
      <ParticulasMandala cantidad={30} escalaPunto={1.5} intensidad={1} tamano={ladoPolvo} visibilidad={polvo} />
    </View>
  ) : null), [dims.alto, dims.ancho, ladoPolvo, polvo]);

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
      {capaPolvo}

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
        {charco && (
          <Animated.View pointerEvents="none" style={[styles.charco, { height: charco.ancho * 0.5, left: charco.x - charco.ancho, top: charco.y - charco.ancho * 0.25, width: charco.ancho * 2 }, estiloCharco]}>
            <Canvas style={StyleSheet.absoluteFill}>
              <Oval color={color} height={charco.ancho * 0.36} opacity={0.9} width={charco.ancho * 1.5} x={charco.ancho * 0.25} y={charco.ancho * 0.07}>
                <BlurMask blur={charco.ancho * 0.18} style="normal" />
              </Oval>
              <Oval color="#FFFFFF" height={charco.ancho * 0.16} width={charco.ancho * 0.9} x={charco.ancho * 0.55} y={charco.ancho * 0.17}>
                <BlurMask blur={charco.ancho * 0.08} style="normal" />
              </Oval>
            </Canvas>
          </Animated.View>
        )}

        {dims.alto > 0 && (
          <Animated.View style={[styles.lienzo, { left: (dims.ancho - LADO) / 2, top: (dims.alto - LADO) / 2 }, estiloMandala]}>
            {fase === 'trazando' || !trazoFinal ? (
              <GestureDetector gesture={gesto}>
                <View style={styles.superficie}>
                  <EscenarioTrazo brilloRayos={brilloRayos} colorTinta={aura} mostrarPista={mostrarPista} puntos={puntos} tinta={tinta} />
                </View>
              </GestureDetector>
            ) : (
              <CintasBlancas aura={aura} trazos={trazoFinal} />
            )}
          </Animated.View>
        )}
      </Animated.View>

      <Animated.View pointerEvents="none" style={[styles.cabecera, estiloTextos]}>
        <Texto style={styles.titulo}>{t('habitos.mandala.compositor.titulo')}</Texto>
        <Texto style={styles.instruccion}>{t('habitos.mandala.compositor.instruccion')}</Texto>
      </Animated.View>

      <Animated.View pointerEvents={fase === 'trazando' ? 'box-none' : 'none'} style={[styles.pie, estiloTextos]}>
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
  polvo: { position: 'absolute' },
  lienzo: { height: LADO, position: 'absolute', width: LADO },
  superficie: { height: LADO, width: LADO },
  sombra: { height: 60, position: 'absolute', width: 220 },
  camara: { transformOrigin: CAMARA_MAPA.origen },
  charco: { position: 'absolute' },
  cabecera: { alignItems: 'center', gap: 6, left: 24, position: 'absolute', right: 24, top: 28 },
  titulo: { color: '#FFFFFF', fontFamily: 'MontserratAlternates-Bold', fontSize: 18, textAlign: 'center' },
  instruccion: { color: 'rgba(255, 255, 255, 0.7)', fontFamily: 'Montserrat-Medium', fontSize: 13, textAlign: 'center' },
  pie: { alignItems: 'center', bottom: 28, left: 24, position: 'absolute', right: 24 },
  masTarde: { color: 'rgba(255, 255, 255, 0.55)', fontFamily: 'Montserrat-SemiBold', fontSize: 13 },
  poema: { alignItems: 'center', bottom: 40, left: 24, position: 'absolute', right: 24 },
  poemaPildora: { backgroundColor: 'rgba(255, 255, 255, 0.78)', borderRadius: 20, paddingHorizontal: 18, paddingVertical: 9 },
  poemaTexto: { fontFamily: 'MontserratAlternates-Bold', fontSize: 15, textAlign: 'center' },
});
