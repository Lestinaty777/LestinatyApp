import { useQuery } from '@tanstack/react-query';
import { ReactNode, useEffect, useRef, useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';
import { BlurMask, Canvas, Circle } from '@shopify/react-native-skia';
import Animated, {
  Easing,
  Extrapolation,
  interpolate,
  runOnJS,
  SharedValue,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

import { MasterButton, Texto } from '../../../diseno';
import { hapticSeguro } from '../../../nucleo/dispositivo/haptics';
import { obtenerCatalogoArboles } from '../../tienda/gemas.servicio';
import type { ArbolPaquete } from '../../tienda/gemas.tipos';
import { obtenerAssetsPaquete } from '../../senderos/algoritmo/registroPaquetesArbol';
import { useEscala } from '../../../diseno/tema/MasterColorContext';
import type { EscalaMaster } from '../../../diseno/tema/escalaEsmeralda';
import { ESCALA_ESMERALDA } from '../../../diseno/tema/escalaEsmeralda';
import { conAlfa } from '../../../diseno/tema/masterColor';

const C = { verde: ESCALA_ESMERALDA.jade.l50 };

// Selección curada de 5 (de los 12+ legendarios reales) para el regalo de
// bienvenida — ver el comentario junto a `paquetes` en CarruselArbolRegalo.
const PAQUETES_ONBOARDING = ['lightmoon', 'golden', 'ignate', 'sakura', 'mathist'];

// Mismo componente local de física flotante ya usado en IntroduccionAppPantalla.tsx
// (duplicado a propósito, no exportado ahí — es el patrón ya establecido en
// este proyecto en vez de compartirlo entre archivos).
function ElementoFlotanteSuave({
  children,
  distancia = 3.5,
  duracion = 2800,
  delay = 0,
  rotacion = '0deg',
  style,
}: {
  children: React.ReactNode;
  distancia?: number;
  duracion?: number;
  delay?: number;
  rotacion?: string;
  style?: any;
}) {
  const translateY = useSharedValue(0);

  useEffect(() => {
    translateY.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(-distancia, { duration: duracion, easing: Easing.inOut(Easing.sin) }),
          withTiming(distancia, { duration: duracion, easing: Easing.inOut(Easing.sin) }),
        ),
        -1,
        true,
      ),
    );
  }, [delay, distancia, duracion, translateY]);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }, { rotate: rotacion }],
  }));

  return <Animated.View style={[style, animStyle]}>{children}</Animated.View>;
}

function hexARgba(hex: string, alpha: number) {
  const limpio = hex.replace('#', '');
  const r = parseInt(limpio.slice(0, 2), 16);
  const g = parseInt(limpio.slice(2, 4), 16);
  const b = parseInt(limpio.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

// Mezcla lineal entre dos colores hex — usado para el color "en vivo" del
// texto y el botón mientras se arrastra entre dos árboles (a diferencia de
// las etapas/aura, que son estilos de Reanimated en el hilo de UI, esto
// alimenta un <Text>/MasterText/MasterButton normales por props, así que se
// actualiza por JS en cada evento de scroll en vez de por worklet).
function mezclarHex(colorA: string, colorB: string, t: number) {
  const a = colorA.replace('#', '');
  const b = colorB.replace('#', '');
  const canal = (inicio: number) => {
    const va = parseInt(a.slice(inicio, inicio + 2), 16);
    const vb = parseInt(b.slice(inicio, inicio + 2), 16);
    return Math.round(va + (vb - va) * t).toString(16).padStart(2, '0');
  };
  return `#${canal(0)}${canal(2)}${canal(4)}`;
}

// Resplandor simple del tono del paquete para llenar el espacio vacío a los
// costados de etapa7 — un solo círculo desenfocado. El lienzo no recorta nada
// (no hay overflow hidden en ningún contenedor padre), así que el desenfoque
// se difumina libremente más allá del recuadro del árbol.
function BlurArbol({ color }: { color: string }) {
  const s = useEstilosS();
  return (
    <Canvas pointerEvents="none" style={s.auraCanvas}>
      <Circle color={hexARgba(color, 0.4)} cx={170} cy={150} r={95}>
        <BlurMask blur={45} style="normal" />
      </Circle>
    </Canvas>
  );
}

// Ventana de revelación de una etapa dentro de la cadena: cada una ocupa 1/7
// del progreso de la página (0 = todavía no llegaste, 1 = página centrada),
// sin superponerse con la siguiente — así la cadena se arma completa
// exactamente al terminar de asentarte en la página.
function useEtapaOpacidad(progreso: SharedValue<number>, orden: number) {
  return useAnimatedStyle(() => ({
    opacity: interpolate(progreso.value, [orden / 7, (orden + 1) / 7], [0, 1], Extrapolation.CLAMP),
  }));
}

// Una página del feed: en vez de disparar la cadena de aparición al asentarse
// el scroll (como antes), acá cada etapa y el aura se revelan EN VIVO según
// qué tan cerca está esta página del centro (`progreso`, derivado de
// `scrollX`) — un swipe rápido dispara la cadena rápido, retroceder a medio
// camino la "des-revela" en reversa. Es un componente propio (no un cuerpo de
// `.map` inline) porque cada página necesita sus propios hooks de Reanimated
// (useDerivedValue/useAnimatedStyle), y la cantidad de hooks tiene que ser
// fija por instancia de componente, no depender de cuántos paquetes carguen.
function PaginaArbol({
  assets,
  idx,
  paquete,
  scrollX,
  width,
}: {
  assets: ReturnType<typeof obtenerAssetsPaquete>;
  idx: number;
  paquete: ArbolPaquete;
  scrollX: SharedValue<number>;
  width: number;
}) {
  const s = useEstilosS();
  const progreso = useDerivedValue(() => 1 - Math.min(1, Math.abs(scrollX.value / width - idx)));

  const estiloAura = useAnimatedStyle(() => ({
    opacity: interpolate(progreso.value, [0, 0.4], [0, 1], Extrapolation.CLAMP),
  }));
  const estiloEtapa0 = useEtapaOpacidad(progreso, 0);
  const estiloEtapa1 = useEtapaOpacidad(progreso, 1);
  const estiloEtapa2 = useEtapaOpacidad(progreso, 2);
  const estiloEtapa3 = useEtapaOpacidad(progreso, 3);
  const estiloEtapa4 = useEtapaOpacidad(progreso, 4);
  const estiloEtapa5 = useEtapaOpacidad(progreso, 5);
  const estiloEtapa6 = useEtapaOpacidad(progreso, 6);

  return (
    <View style={[s.pagina, { width }]}>
      {assets && (
        <View style={s.collage}>
          <View style={s.envoltorioGrande}>
            <Animated.View pointerEvents="none" style={[s.auraEnvoltorio, estiloAura]}>
              <BlurArbol color={paquete.masterPackColor} />
            </Animated.View>
            <ElementoFlotanteSuave delay={0} distancia={5} duracion={3200} rotacion="-8deg" style={s.rocaIzquierda}>
              <Image resizeMode="contain" source={require('../../../../assets/ilustraciones/senderos/biomas/arboles/roca.png')} style={s.roca} />
            </ElementoFlotanteSuave>
            <ElementoFlotanteSuave delay={400} distancia={4} duracion={2600} rotacion="6deg" style={s.rocaDerecha}>
              <Image resizeMode="contain" source={require('../../../../assets/ilustraciones/senderos/biomas/arboles/roca1.png')} style={s.rocaChica} />
            </ElementoFlotanteSuave>
            <ElementoFlotanteSuave delay={800} distancia={4.5} duracion={3000} rotacion="12deg" style={s.rocaAbajo}>
              <Image resizeMode="contain" source={require('../../../../assets/ilustraciones/senderos/biomas/arboles/roca.png')} style={s.rocaChica} />
            </ElementoFlotanteSuave>
            <Animated.Image resizeMode="contain" source={assets.etapas[6]} style={[s.imgGrande, estiloEtapa6]} />
          </View>
          <View style={s.filaChica}>
            <Animated.Image resizeMode="contain" source={assets.etapas[0]} style={[s.imgChica, estiloEtapa0]} />
            <Animated.Image resizeMode="contain" source={assets.etapas[1]} style={[s.imgChica, estiloEtapa1]} />
            <Animated.Image resizeMode="contain" source={assets.etapas[2]} style={[s.imgChica, estiloEtapa2]} />
          </View>
          <View style={s.filaMedia}>
            <Animated.Image resizeMode="contain" source={assets.etapas[3]} style={[s.imgMedia, estiloEtapa3]} />
            <Animated.Image resizeMode="contain" source={assets.etapas[4]} style={[s.imgMedia, estiloEtapa4]} />
            <Animated.Image resizeMode="contain" source={assets.etapas[5]} style={[s.imgMedia, estiloEtapa5]} />
          </View>
        </View>
      )}
    </View>
  );
}

// Feed de un árbol a la vez con swipe real — a diferencia de SelectorArbolRegalo
// (grilla, usado también por el modal del trial de Horizon), acá lo que está
// a la vista ES la selección: no hay paso de "elegir" separado de "confirmar".
// Exclusivo de RegaloBienvenidaPantalla — el modal del trial sigue con la
// grilla, donde una escena a pantalla completa no calza igual de bien.
export function CarruselArbolRegalo({
  confirmando,
  contenidoInferior,
  fondo,
  onConfirmar,
  textoBotonConfirmando = 'Plantando tu árbol…',
  paddingBottomPie = 18,
}: {
  confirmando: boolean;
  // Render-props en vez de un ReactNode fijo: quien nos usa necesita saber
  // cuál es el árbol actualmente a la vista (para su arbusto/tono real). Son
  // dos props separados (no uno solo) para poder ubicar `fondo` ANTES del
  // ScrollView en el orden de pintado — si fuera parte de contenidoInferior
  // (que se renderiza después del ScrollView) quedaría tapando el collage
  // en vez de detrás.
  // El segundo parámetro es el color "en vivo" (mezcla continua entre el
  // paquete actual y el siguiente/anterior según el arrastre) — para que el
  // texto adopte el mismo color que ya usa el botón, sin depender de
  // `paqueteActual` (que solo cambia al asentarse el scroll).
  contenidoInferior?: (paqueteActual: ArbolPaquete | undefined, colorActivo: string) => ReactNode;
  fondo?: (paqueteActual: ArbolPaquete | undefined) => ReactNode;
  onConfirmar: (paqueteId: string) => void;
  textoBotonConfirmando?: string;
  paddingBottomPie?: number;
}) {
  const s = useEstilosS();
  const { width } = useWindowDimensions();
  const scrollRef = useRef<ScrollView>(null);
  const [indice, setIndice] = useState(0);
  const [colorContinuo, setColorContinuo] = useState<string | null>(null);
  const scrollX = useSharedValue(0);

  const consultaCatalogo = useQuery({ queryKey: ['tienda', 'catalogoArboles'], queryFn: obtenerCatalogoArboles });
  // Curada para esta pantalla puntual (no la tienda, que sigue mostrando el
  // catálogo legendario completo): con 12 paquetes un carrusel de "uno a la
  // vez" en un flujo obligatorio de onboarding es demasiado swipe. Se eligió
  // esta selección por variedad de color (azul, amarillo, rojo, rosa,
  // morado) en vez de repetir tonos parecidos (había 3 azules/helados).
  const paquetesCatalogo = consultaCatalogo.data ?? [];
  const paquetes = PAQUETES_ONBOARDING.map((id) => paquetesCatalogo.find((p) => p.id === id)).filter(
    (p): p is ArbolPaquete => p !== undefined,
  );
  const paqueteActual = paquetes[indice];
  // Antes del primer scroll (o si algo falla) cae al color discreto del
  // árbol activo — así el botón/texto ya arrancan con el color correcto.
  const colorActivo = colorContinuo ?? paqueteActual?.masterPackColor ?? C.verde;

  // Recalcula el color mezclado en JS (no es un estilo de worklet: alimenta
  // <Text>/MasterText/MasterButton normales por props) a partir de la
  // posición cruda del scroll — se llama en cada evento, igual de seguido
  // que la cadena de etapas, pero por el puente a JS en vez de UI thread.
  function actualizarColorContinuo(offsetX: number) {
    if (paquetes.length === 0) return;
    const flotante = Math.max(0, Math.min(paquetes.length - 1, offsetX / width));
    const i = Math.floor(flotante);
    const t = flotante - i;
    const colorA = paquetes[i]?.masterPackColor ?? C.verde;
    const colorB = paquetes[Math.min(i + 1, paquetes.length - 1)]?.masterPackColor ?? colorA;
    setColorContinuo(mezclarHex(colorA, colorB, t));
  }

  // La revelación en cadena y el aura se animan en vivo con `scrollX` (ver
  // PaginaArbol, en el hilo de UI). `indice` solo maneja lo discreto: qué
  // punto está activo y a cuál árbol confirma el botón.
  const manejarScroll = useAnimatedScrollHandler({
    onScroll: (evento) => {
      scrollX.value = evento.contentOffset.x;
      runOnJS(actualizarColorContinuo)(evento.contentOffset.x);
    },
  });

  function alTerminarScroll(evento: { nativeEvent: { contentOffset: { x: number } } }) {
    const nuevoIndice = Math.round(evento.nativeEvent.contentOffset.x / width);
    setIndice(Math.max(0, Math.min(paquetes.length - 1, nuevoIndice)));
  }

  function irAIndice(destino: number) {
    hapticSeguro('seleccion');
    setIndice(destino);
    scrollRef.current?.scrollTo({ x: destino * width, animated: true });
  }

  function confirmar() {
    if (!paqueteActual) return;
    hapticSeguro('seleccion');
    onConfirmar(paqueteActual.id);
  }

  if (consultaCatalogo.isLoading) {
    return (
      <View style={s.cargandoContenedor}>
        <Texto style={s.cargando}>Cargando especies de árboles…</Texto>
      </View>
    );
  }

  return (
    <>
      {fondo?.(paqueteActual)}

      <Animated.ScrollView
        horizontal
        onMomentumScrollEnd={alTerminarScroll}
        onScroll={manejarScroll}
        pagingEnabled
        ref={scrollRef}
        scrollEventThrottle={16}
        showsHorizontalScrollIndicator={false}
        style={s.scroll}
      >
        {paquetes.map((paquete, idx) => (
          <PaginaArbol assets={obtenerAssetsPaquete(paquete.id)} idx={idx} key={paquete.id} paquete={paquete} scrollX={scrollX} width={width} />
        ))}
      </Animated.ScrollView>

      <View style={[s.panelInferior, { paddingBottom: paddingBottomPie }]}>
        {contenidoInferior?.(paqueteActual, colorActivo)}

        <View style={s.puntos}>
          {paquetes.map((paquete, idx) => (
            <Pressable hitSlop={8} key={paquete.id} onPress={() => irAIndice(idx)}>
              <View style={[s.punto, idx === indice && [s.puntoActivo, { backgroundColor: paquete.masterPackColor }]]} />
            </Pressable>
          ))}
        </View>

        <View style={s.pie}>
          <MasterButton color={colorActivo} disabled={!paqueteActual || confirmando} onPress={confirmar} style={s.botonConfirmar}>
            {confirmando ? textoBotonConfirmando : paqueteActual ? `ELEGIR A ${paqueteActual.nombre.toUpperCase()}` : 'SIN ÁRBOLES DISPONIBLES'}
          </MasterButton>
        </View>
      </View>
    </>
  );
}

const crearEstilosS = (esc: EscalaMaster) => StyleSheet.create({
  scroll: { flex: 1 },
  cargandoContenedor: { alignItems: 'center', flex: 1, justifyContent: 'center', paddingVertical: 48 },
  cargando: { color: esc.musgo.l51, fontFamily: 'Montserrat-Medium', fontSize: 13, textAlign: 'center' },
  pagina: { alignItems: 'center', gap: 8, justifyContent: 'center', paddingVertical: 12 },
  collage: { alignItems: 'center', gap: 8 },
  filaChica: { flexDirection: 'row', gap: 12, justifyContent: 'center' },
  filaMedia: { flexDirection: 'row', gap: 14, justifyContent: 'center' },
  imgChica: { height: 72, width: 72 },
  imgMedia: { height: 92, width: 92 },
  envoltorioGrande: { alignItems: 'center', height: 240, justifyContent: 'center', marginBottom: 2, width: 240 },
  auraEnvoltorio: { left: -50, position: 'absolute', top: -30, zIndex: 0 },
  auraCanvas: { height: 300, width: 340 },
  imgGrande: { height: 240, width: 240, zIndex: 2 },
  roca: { height: 44, width: 44 },
  rocaChica: { height: 34, width: 34 },
  rocaIzquierda: { left: -14, position: 'absolute', top: '48%', zIndex: 1 },
  rocaDerecha: { position: 'absolute', right: -10, top: '20%', zIndex: 1 },
  rocaAbajo: { bottom: -6, position: 'absolute', right: '22%', zIndex: 1 },
  puntos: { flexDirection: 'row', gap: 6, justifyContent: 'center', marginTop: 4 },
  punto: { backgroundColor: conAlfa(esc.jade.l50, 0.25), borderRadius: 3.5, height: 7, width: 7 },
  puntoActivo: { width: 20 },
  // Un solo panel glass envuelve todo el bloque inferior — desde el texto
  // (título incluido) hasta el botón — en vez de que el fondo glass sea
  // exclusivo del botón como antes.
  panelInferior: {
    backgroundColor: 'rgba(255, 255, 255, 0.65)',
    borderTopColor: 'rgba(255, 255, 255, 0.85)',
    borderTopWidth: 1,
    paddingTop: 20,
  },
  pie: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  botonConfirmar: { height: 56, width: '100%' },
});

const estilosPorEscalaS = new WeakMap<EscalaMaster, ReturnType<typeof crearEstilosS>>();

function useEstilosS() {
  const esc = useEscala();
  let valor = estilosPorEscalaS.get(esc);
  if (!valor) {
    valor = crearEstilosS(esc);
    estilosPorEscalaS.set(esc, valor);
  }
  return valor;
}
