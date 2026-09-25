import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Image,
  type ImageSourcePropType,
  KeyboardAvoidingView,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  useWindowDimensions,
  View,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Circle, Defs, RadialGradient, Stop } from 'react-native-svg';
import Animated, {
  Easing,
  FadeIn,
  FadeInDown,
  FadeInUp,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import {
  Check,
  ChevronLeft,
  ChevronRight,
  Flame,
  Sparkles,
  Trophy,
} from 'lucide-react-native';

import {
  MasterButton,
  MasterGlass,
  MasterText,
  Rebote,
  Texto,
} from '../../../diseno';
import { hapticSeguro } from '../../../nucleo/dispositivo/haptics';
import { AuroraBoreal } from '../../hoy/componentes/AuroraBoreal';
import { ContenedorMapaSenderos } from '../../senderos/componentes/mapa/ContenedorMapaSenderos';
import type { NodoMapaSendero } from '../../senderos/datos/mapaEjercicio.mock';
import { marcarIntroduccionAppVista } from '../introduccionApp';
import { FormularioAccesoOnboarding } from '../componentes/FormularioAccesoOnboarding';
import { DIAS_POR_MAPA } from '../../habitos/senderoNiveles';
import { useEscala } from '../../../diseno/tema/MasterColorContext';
import type { EscalaMaster } from '../../../diseno/tema/escalaEsmeralda';
import { ESCALA_ESMERALDA } from '../../../diseno/tema/escalaEsmeralda';
import { conAlfa } from '../../../diseno/tema/masterColor';

// Paleta Light de HabitosPantalla / InsightsPantalla
const C = {
  fondo: ESCALA_ESMERALDA.hoja.l99,
  texto: '#1A1335',
  tenue: ESCALA_ESMERALDA.musgo.l51,
  verde: ESCALA_ESMERALDA.jade.l50,
  verdeSombra: ESCALA_ESMERALDA.hoja.l19,
  dorado: '#EAB308',
  morado: '#8B5CF6',
  glass: 'rgba(255,255,255,0.78)',
  glassBorde: 'rgba(255,255,255,0.85)',
};

// Variación mínima para que el énfasis se sienta orgánico, no llamativo.
const crearTemaDEGRADADO_VERDE_SUTIL = (esc: EscalaMaster) => ([esc.jade.l50, esc.jade.l50, esc.hoja.l46] as const);

const temaPorEscalaDEGRADADO_VERDE_SUTIL = new WeakMap<EscalaMaster, ReturnType<typeof crearTemaDEGRADADO_VERDE_SUTIL>>();

function useTemaDEGRADADO_VERDE_SUTIL() {
  const esc = useEscala();
  let valor = temaPorEscalaDEGRADADO_VERDE_SUTIL.get(esc);
  if (!valor) {
    valor = crearTemaDEGRADADO_VERDE_SUTIL(esc);
    temaPorEscalaDEGRADADO_VERDE_SUTIL.set(esc, valor);
  }
  return valor;
}
const DEGRADADO_MORADO_SUTIL = ['#7E22CE', '#9333EA', '#A855F7'] as const;

// Elemento con física flotante suave continua
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
        true
      )
    );
  }, [delay, distancia, duracion, translateY]);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }, { rotate: rotacion }],
  }));

  return <Animated.View style={[style, animStyle]}>{children}</Animated.View>;
}

// Muestra de especies de árboles con arte real y accesorios de bioma
type EspecieDemoItem = {
  color: string;
  nombre: string;
  tipo: string;
  tipoClave: 'bosqueVivo' | 'follajeDorado' | 'ambarSolar' | 'bosqueCeleste' | 'cristalNevado' | 'formulaAzul';
  emoji: string;
  aurora: 'amarillo' | 'morado' | 'verde';
  gema: ImageSourcePropType;
  imagen: ImageSourcePropType;
  etapa5: ImageSourcePropType;
  arbusto: ImageSourcePropType;
  flor: ImageSourcePropType;
  semilla: ImageSourcePropType;
  degradadoTexto: readonly [string, string, string];
};

const ESPECIES_DEMO: EspecieDemoItem[] = [
  {
    color: ESCALA_ESMERALDA.menta.l53, nombre: 'Esmeralda', tipo: 'Bosque Vivo', tipoClave: 'bosqueVivo', emoji: '🌿', aurora: 'verde',
    gema: require('../../../../assets/ilustraciones/senderos/biomas/paquetes/Esmeralda/esmeralda.png'),
    imagen: require('../../../../assets/ilustraciones/senderos/biomas/paquetes/Esmeralda/etapa7.png'),
    etapa5: require('../../../../assets/ilustraciones/senderos/biomas/paquetes/Esmeralda/etapa5.png'),
    arbusto: require('../../../../assets/ilustraciones/senderos/biomas/paquetes/Esmeralda/arbusto.png'),
    flor: require('../../../../assets/ilustraciones/senderos/biomas/paquetes/Esmeralda/flor.png'),
    semilla: require('../../../../assets/ilustraciones/senderos/biomas/paquetes/Esmeralda/semilla.png'),
    degradadoTexto: [ESCALA_ESMERALDA.jade.l29, ESCALA_ESMERALDA.jade.l38, ESCALA_ESMERALDA.jade.l50],
  },
  {
    color: '#D97706', nombre: 'Golden', tipo: 'Follaje Dorado', tipoClave: 'follajeDorado', emoji: '✨', aurora: 'amarillo',
    gema: require('../../../../assets/ilustraciones/senderos/biomas/paquetes/Golden/golden.png'),
    imagen: require('../../../../assets/ilustraciones/senderos/biomas/paquetes/Golden/etapa7.png'),
    etapa5: require('../../../../assets/ilustraciones/senderos/biomas/paquetes/Golden/etapa5.png'),
    arbusto: require('../../../../assets/ilustraciones/senderos/biomas/paquetes/Golden/arbusto.png'),
    flor: require('../../../../assets/ilustraciones/senderos/biomas/paquetes/Golden/flor.png'),
    semilla: require('../../../../assets/ilustraciones/senderos/biomas/paquetes/Golden/semilla.png'),
    degradadoTexto: ['#78350F', '#B45309', '#D97706'],
  },
  {
    color: '#F59E0B', nombre: 'Amber', tipo: 'Ámbar Solar', tipoClave: 'ambarSolar', emoji: '🟠', aurora: 'amarillo',
    gema: require('../../../../assets/ilustraciones/senderos/biomas/paquetes/Amber/amber.png'),
    imagen: require('../../../../assets/ilustraciones/senderos/biomas/paquetes/Amber/etapa7.png'),
    etapa5: require('../../../../assets/ilustraciones/senderos/biomas/paquetes/Amber/etapa5.png'),
    arbusto: require('../../../../assets/ilustraciones/senderos/biomas/paquetes/Amber/arbusto.png'),
    flor: require('../../../../assets/ilustraciones/senderos/biomas/paquetes/Amber/flor.png'),
    semilla: require('../../../../assets/ilustraciones/senderos/biomas/paquetes/Amber/semilla.png'),
    degradadoTexto: ['#92400E', '#D97706', '#F59E0B'],
  },
  {
    color: '#8B5CF6', nombre: 'Celesthia', tipo: 'Bosque Celeste', tipoClave: 'bosqueCeleste', emoji: '🔮', aurora: 'morado',
    gema: require('../../../../assets/ilustraciones/senderos/biomas/paquetes/Celesthia/celesthia.png'),
    imagen: require('../../../../assets/ilustraciones/senderos/biomas/paquetes/Celesthia/etapa7.png'),
    etapa5: require('../../../../assets/ilustraciones/senderos/biomas/paquetes/Celesthia/etapa5.png'),
    arbusto: require('../../../../assets/ilustraciones/senderos/biomas/paquetes/Celesthia/arbusto.png'),
    flor: require('../../../../assets/ilustraciones/senderos/biomas/paquetes/Celesthia/flor.png'),
    semilla: require('../../../../assets/ilustraciones/senderos/biomas/paquetes/Celesthia/semilla.png'),
    degradadoTexto: ['#5B21B6', '#7C3AED', '#8B5CF6'],
  },
  {
    color: '#80B0E0', nombre: 'Nevalhi', tipo: 'Cristal Nevado', tipoClave: 'cristalNevado', emoji: '❄️', aurora: 'morado',
    gema: require('../../../../assets/ilustraciones/senderos/biomas/paquetes/Nevalhi/Nevalhy.png'),
    imagen: require('../../../../assets/ilustraciones/senderos/biomas/paquetes/Nevalhi/etapa7.png'),
    etapa5: require('../../../../assets/ilustraciones/senderos/biomas/paquetes/Nevalhi/etapa5.png'),
    arbusto: require('../../../../assets/ilustraciones/senderos/biomas/paquetes/Nevalhi/arbusto.png'),
    flor: require('../../../../assets/ilustraciones/senderos/biomas/paquetes/Nevalhi/flor.png'),
    semilla: require('../../../../assets/ilustraciones/senderos/biomas/paquetes/Nevalhi/semilla.png'),
    degradadoTexto: ['#1E3A8A', '#3B82F6', '#80B0E0'],
  },
  {
    color: '#3B82F6', nombre: 'Mathist', tipo: 'Fórmula Azul', tipoClave: 'formulaAzul', emoji: '📘', aurora: 'morado',
    gema: require('../../../../assets/ilustraciones/senderos/biomas/paquetes/Mathist/Mathist.png'),
    imagen: require('../../../../assets/ilustraciones/senderos/biomas/paquetes/Mathist/etapa7.png'),
    etapa5: require('../../../../assets/ilustraciones/senderos/biomas/paquetes/Mathist/etapa5.png'),
    arbusto: require('../../../../assets/ilustraciones/senderos/biomas/paquetes/Mathist/arbusto.png'),
    flor: require('../../../../assets/ilustraciones/senderos/biomas/paquetes/Mathist/flor.png'),
    semilla: require('../../../../assets/ilustraciones/senderos/biomas/paquetes/Mathist/semilla.png'),
    degradadoTexto: ['#1E3A8A', '#2563EB', '#3B82F6'],
  },
];

type BiomaCarruselItem = {
  id: string;
  paqueteId: string;
  nombre: string;
  color: string;
  emoji: string;
  aurora: 'verde' | 'morado' | 'rojo' | 'amarillo';
  arbusto: ImageSourcePropType;
  degradadoTexto: readonly [string, string, string];
};

// El slide 2 muestra un único sendero de demostración (Esmeralda, nivel 1) —
// antes rotaba entre varios biomas con flechas/puntos, pero eso competía con
// el mensaje del slide ("así se ve tu progreso día a día") en vez de
// reforzarlo. Se deja como array de un solo elemento (en vez de una constante
// suelta) para no tocar el resto del código que ya lee `BIOMAS_CARRUSEL[0]`.
const BIOMAS_CARRUSEL: BiomaCarruselItem[] = [
  {
    id: 'esmeralda',
    paqueteId: 'esmeralda',
    nombre: 'Esmeralda',
    color: ESCALA_ESMERALDA.menta.l53,
    emoji: '🌿',
    aurora: 'verde',
    arbusto: require('../../../../assets/ilustraciones/senderos/biomas/paquetes/Esmeralda/arbusto.png'),
    degradadoTexto: [ESCALA_ESMERALDA.jade.l29, ESCALA_ESMERALDA.jade.l38, ESCALA_ESMERALDA.jade.l50],
  },
];

export function IntroduccionAppPantalla() {
  const { t } = useTranslation();
  const esc = useEscala();
  const DEGRADADO_VERDE_SUTIL = useTemaDEGRADADO_VERDE_SUTIL();
  const s = useEstilosS();
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const [slideActivo, setSlideActivo] = useState(0);
  const [slideEnTransicion, setSlideEnTransicion] = useState<number | null>(null);
  const [indiceEspecie, setIndiceEspecie] = useState(0);
  const scrollRef = useRef<ScrollView>(null);
  // Nivel 1 real tiene 3 días (DIAS_POR_MAPA[1]) — antes esto simulaba 10
  // días con nivel 2 hardcodeado, sin relación con ningún nivel real. Ahora
  // que el slide muestra "nivel 1" de verdad, la demo calza con su
  // estructura real: día 1 completado, día 2 activo (el de hoy), día 3
  // bloqueado — mismo patrón "ya llevás una rachita" de antes, a escala.
  const diasNivel1Demo = DIAS_POR_MAPA[1];
  const nodosDemo = useMemo<NodoMapaSendero[]>(() => Array.from({ length: diasNivel1Demo }, (_, indice) => ({
    estado: indice < 1 ? 'completado' : indice === 1 ? 'activo' : 'bloqueado',
    icono: Check,
    id: `intro-demo-${indice}`,
    subtitulo: t('onboarding.intro.slide2.dayDemo', { day: indice + 1 }),
    titulo: t('onboarding.intro.slide2.dayDemo', { day: indice + 1 }),
  })), [t, diasNivel1Demo]);
  const totalSlides = 5;
  const esUltima = slideActivo === totalSlides - 1;
  const biomaActual = BIOMAS_CARRUSEL[0];
  const nombreBioma = t(`onboarding.intro.slide2.biomes.${biomaActual.id}`, { defaultValue: biomaActual.nombre });
  const especieActual = ESPECIES_DEMO[indiceEspecie];
  const tamanoTituloHero = Math.min(48, Math.max(40, Math.round((width - 32) * 0.116)));
  const altoTituloHero = tamanoTituloHero + 8;
  const tamanoSubtituloHero = Math.min(38, Math.max(30, Math.round(tamanoTituloHero * 0.8)));
  const altoSubtituloHero = tamanoSubtituloHero + 7;
  const alturaMapaSlide2 = Math.min(320, Math.max(230, Math.round(height * 0.39)));


  // El login vive en el slide 5 (índice totalSlides - 1) — ya sea llegando
  // deslizando o saltando con "Omitir", apenas se asienta ahí se marca la
  // intro como vista. Sin esto, cerrar la app antes de loguearse volvería a
  // mostrar los 4 slides de marketing en el próximo arranque.
  useEffect(() => {
    if (slideActivo === totalSlides - 1) void marcarIntroduccionAppVista();
  }, [slideActivo]);

  function alScroll(evento: NativeSyntheticEvent<NativeScrollEvent>) {
    const desplazamiento = evento.nativeEvent.contentOffset.x;
    const direccion = desplazamiento - slideActivo * width;
    if (Math.abs(direccion) < 8) return;
    const destino = Math.max(0, Math.min(totalSlides - 1, slideActivo + (direccion > 0 ? 1 : -1)));
    if (destino !== slideActivo && destino !== slideEnTransicion) setSlideEnTransicion(destino);
  }

  function alTerminarScroll(evento: NativeSyntheticEvent<NativeScrollEvent>) {
    const indice = Math.round(evento.nativeEvent.contentOffset.x / width);
    setSlideActivo(Math.max(0, Math.min(totalSlides - 1, indice)));
    setSlideEnTransicion(null);
  }

  function debeMontarSlide(indice: number) {
    return indice === slideActivo || indice === slideEnTransicion;
  }

  function siguiente() {
    hapticSeguro('seleccion');
    setSlideEnTransicion(slideActivo + 1);
    scrollRef.current?.scrollTo({ x: (slideActivo + 1) * width, animated: true });
  }

  // "Omitir" ya no navega afuera — salta directo al slide del login (el
  // useEffect de arriba marca la intro como vista apenas se asiente ahí).
  function saltarAlLogin() {
    hapticSeguro('seleccion');
    setSlideEnTransicion(totalSlides - 1);
    scrollRef.current?.scrollTo({ x: (totalSlides - 1) * width, animated: true });
  }

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={s.raiz}>
      {/* Fondo Light Ambiental Unificado */}
      <LinearGradient
        colors={[esc.hoja.l99, esc.hoja.l95, esc.hoja.l93]}
        end={{ x: 0, y: 1 }}
        start={{ x: 0, y: 0 }}
        style={StyleSheet.absoluteFill}
      />

      {/* Botón Omitir Superior Flotante con MasterGlass — no tiene sentido una
          vez que ya se está en el slide del login */}
      {!esUltima && (
        <View style={[s.barraTope, { top: insets.top + 10 }]}>
          <Rebote accessibilityLabel={t('onboarding.intro.skipAccessibility')} onPress={saltarAlLogin}>
            <MasterGlass style={s.omitirGlass}>
              <Texto style={s.omitirTexto}>{t('onboarding.intro.skip')}</Texto>
              <ChevronRight color={C.tenue} size={15} strokeWidth={2.5} />
            </MasterGlass>
          </Rebote>
        </View>
      )}

      <ScrollView
        bounces={false}
        horizontal
        onScroll={alScroll}
        onMomentumScrollEnd={alTerminarScroll}
        pagingEnabled
        ref={scrollRef}
        scrollEventThrottle={32}
        showsHorizontalScrollIndicator={false}
        style={{ flex: 1 }}
      >
        {/* SLIDE 1: IDENTIDAD Y MARCA LESTINATY */}
        <View style={[s.slide, { width, paddingTop: insets.top + 48 }]}>
          {debeMontarSlide(0) && <>
          <AuroraBoreal tema="verde" />

          {/* Ilustración Hero: Árbol de habitos.png (/fondos) con elementos vivos flotantes */}
          <View style={s.slide1HeroArbol}>
            {/* Terreno bajo el árbol: rocas y pasto forman una base discreta. */}
            <View pointerEvents="none" style={s.slide1Terreno}>
              <Image
                resizeMode="contain"
                source={require('../../../../assets/ilustraciones/senderos/biomas/arboles/roca1.png')}
                style={[s.terrenoPieza, s.terrenoRocaIzquierda]}
              />
              <Image
                resizeMode="contain"
                source={require('../../../../assets/ilustraciones/senderos/biomas/arboles/pasto.png')}
                style={[s.terrenoPieza, s.terrenoPastoIzquierdo]}
              />
              <Image
                resizeMode="contain"
                source={require('../../../../assets/ilustraciones/senderos/biomas/arboles/roca.png')}
                style={[s.terrenoPieza, s.terrenoRocaDerecha]}
              />
              <Image
                resizeMode="contain"
                source={require('../../../../assets/ilustraciones/senderos/biomas/arboles/pasto.png')}
                style={[s.terrenoPieza, s.terrenoPastoDerecho]}
              />
            </View>

            <Image
              resizeMode="contain"
              source={require('../../../../assets/ilustraciones/hoy/fondos/habitos.png')}
              style={s.slide1ArbolFondosImg}
            />

            {/* Elementos ambientales flotantes */}
            <ElementoFlotanteSuave delay={0} distancia={3.5} duracion={2600} rotacion="-14deg" style={s.flotanteRocaTop}>
              <Image
                resizeMode="contain"
                source={require('../../../../assets/ilustraciones/senderos/biomas/arboles/roca.png')}
                style={s.imgFlotante}
              />
            </ElementoFlotanteSuave>

            <ElementoFlotanteSuave delay={400} distancia={4} duracion={3100} rotacion="12deg" style={s.flotantePastoTop}>
              <Image
                resizeMode="contain"
                source={require('../../../../assets/ilustraciones/senderos/biomas/arboles/pasto.png')}
                style={s.imgFlotante}
              />
            </ElementoFlotanteSuave>

            <ElementoFlotanteSuave delay={750} distancia={3} duracion={2500} rotacion="20deg" style={s.flotanteRocaMid}>
              <Image
                resizeMode="contain"
                source={require('../../../../assets/ilustraciones/senderos/biomas/arboles/roca1.png')}
                style={s.imgFlotante}
              />
            </ElementoFlotanteSuave>
          </View>

          {/* Mensaje principal: Fila con arbusto + Cultiva tu vida, y que quieres centrado abajo */}
          <View style={s.slide1Textos}>
            <Texto style={[s.slide1Titulo, { fontSize: tamanoTituloHero, lineHeight: altoTituloHero }]}>
              {t('onboarding.intro.slide1.title')}
            </Texto>

            <View style={s.slide1TituloFila}>
              <Image
                resizeMode="contain"
                source={require('../../../../assets/ilustraciones/senderos/biomas/paquetes/Esmeralda/arbusto.png')}
                style={[
                  s.slide1ArbustoIzquierdo,
                  { height: altoSubtituloHero, width: altoSubtituloHero },
                ]}
              />
              <MasterText
                coloresGradiente={DEGRADADO_VERDE_SUTIL}
                gradiente={true}
                style={[s.slide1TituloGradiente, { fontSize: tamanoSubtituloHero, lineHeight: altoSubtituloHero }]}
                variante="titulo"
              >
                {t('onboarding.intro.slide1.accent')}
              </MasterText>
              <Image
                resizeMode="contain"
                source={require('../../../../assets/ilustraciones/senderos/biomas/paquetes/Esmeralda/arbusto.png')}
                style={[
                  s.slide1ArbustoDerecho,
                  { height: altoSubtituloHero, width: altoSubtituloHero },
                ]}
              />
            </View>

            {/* Separador de línea orgánico suave */}
            <LinearGradient
              colors={[conAlfa(esc.jade.l50, 0), conAlfa(esc.jade.l50, 0.32), conAlfa(esc.jade.l50, 0)]}
              end={{ x: 1, y: 0 }}
              start={{ x: 0, y: 0 }}
              style={s.slide1SeparadorLinea}
            />

            <Texto style={s.slide1Subtitulo}>
              {t('onboarding.intro.slide1.subtitle')}
            </Texto>
          </View>
          </>}
        </View>

        {/* SLIDE 2: EL SENDERO Y MAPA VIVO EN TIEMPO REAL */}
        <View style={[s.slide, { width, paddingTop: insets.top + 48 }]}>
          {debeMontarSlide(1) && <>
          {/* Hero Central: Ventana de Mapa Real con Carrusel Interactivo de Biomas */}
          <View style={[s.slide2HeroMapa, { height: alturaMapaSlide2 }]}>
            {/* Terreno base sutil bajo el mapa */}
            <View pointerEvents="none" style={s.slide2TerrenoBase}>
              <Image
                resizeMode="contain"
                source={require('../../../../assets/ilustraciones/senderos/biomas/arboles/roca1.png')}
                style={[s.terrenoPieza, s.terrenoRocaIzquierda]}
              />
              <Image
                resizeMode="contain"
                source={require('../../../../assets/ilustraciones/senderos/biomas/arboles/pasto.png')}
                style={[s.terrenoPieza, s.terrenoPastoIzquierdo]}
              />
              <Image
                resizeMode="contain"
                source={require('../../../../assets/ilustraciones/senderos/biomas/arboles/roca.png')}
                style={[s.terrenoPieza, s.terrenoRocaDerecha]}
              />
              <Image
                resizeMode="contain"
                source={require('../../../../assets/ilustraciones/senderos/biomas/arboles/pasto.png')}
                style={[s.terrenoPieza, s.terrenoPastoDerecho]}
              />
            </View>

            {/* Elementos ambientales flotantes */}
            <ElementoFlotanteSuave delay={200} distancia={3.5} duracion={2700} rotacion="10deg" style={s.flotantePastoTop}>
              <Image
                resizeMode="contain"
                source={require('../../../../assets/ilustraciones/senderos/biomas/arboles/pasto.png')}
                style={s.imgFlotante}
              />
            </ElementoFlotanteSuave>
            <ElementoFlotanteSuave delay={600} distancia={3} duracion={2900} rotacion="-12deg" style={s.flotanteRocaTop}>
              <Image
                resizeMode="contain"
                source={require('../../../../assets/ilustraciones/senderos/biomas/arboles/roca.png')}
                style={s.imgFlotante}
              />
            </ElementoFlotanteSuave>

            <View style={s.slide2MapaMarco}>
              <View pointerEvents="none" style={s.mapaContenedor}>
                <ContenedorMapaSenderos
                  altura={alturaMapaSlide2}
                  categoriaId="habitos"
                  color={biomaActual.color}
                  enfocado={false}
                  desplazamientoSuperior={60}
                  nivel={1}
                  nodos={nodosDemo}
                  paqueteId={biomaActual.paqueteId}
                  subcategoriaId="intro-demo"
                />
                <LinearGradient
                  colors={[esc.hoja.l99, conAlfa(esc.hoja.l99, 0)]}
                  style={s.mapaDegradadoTope}
                />
                <LinearGradient
                  colors={[conAlfa(esc.hoja.l93, 0), esc.hoja.l93]}
                  style={s.mapaDegradadoPiso}
                />
              </View>
            </View>
          </View>

          {/* Un único sendero de demostración (Esmeralda, nivel 1) — sin
              flechas ni puntos, ya no hay entre qué navegar. Se deja la
              insignia como etiqueta fija, no como control. */}
          <View style={s.slide2Controles}>
            <View style={s.carruselInsignia}>
              <MasterGlass colorBase={biomaActual.color} style={s.carruselInsigniaGlass}>
                <Texto style={s.carruselInsigniaEmoji}>{biomaActual.emoji}</Texto>
                <Texto style={[s.carruselInsigniaTexto, { color: biomaActual.color }]}>{t('onboarding.intro.slide2.badge', { nombre: nombreBioma })}</Texto>
              </MasterGlass>
            </View>
          </View>

          {/* Textos inferiores alineados con la identidad de Slide 1 */}
          <View style={s.slide1Textos}>
            <Texto
              adjustsFontSizeToFit
              minimumFontScale={0.82}
              numberOfLines={1}
              style={[
                s.slide1Titulo,
                {
                  fontSize: Math.min(46, Math.max(38, Math.round((width - 32) * 0.125))),
                  letterSpacing: -0.9,
                  lineHeight: altoTituloHero,
                  width: '90%',
                },
              ]}
            >
              {t('onboarding.intro.slide2.title')}
            </Texto>

            <View style={s.slide1TituloFila}>
              <Image
                key={`arbusto-izq-${biomaActual.id}`}
                resizeMode="contain"
                source={biomaActual.arbusto}
                style={[
                  s.slide1ArbustoIzquierdo,
                  { height: altoSubtituloHero, width: altoSubtituloHero },
                ]}
              />
              <MasterText
                coloresGradiente={biomaActual.degradadoTexto}
                gradiente={true}
                style={[s.slide1TituloGradiente, { fontSize: tamanoSubtituloHero, lineHeight: altoSubtituloHero }]}
                variante="titulo"
              >
                {t('onboarding.intro.slide2.accent')}
              </MasterText>
              <Image
                key={`arbusto-der-${biomaActual.id}`}
                resizeMode="contain"
                source={biomaActual.arbusto}
                style={[
                  s.slide1ArbustoDerecho,
                  { height: altoSubtituloHero, width: altoSubtituloHero },
                ]}
              />
            </View>

            {/* Separador de línea orgánico suave sincronizado con el color del bioma */}
            <LinearGradient
              colors={[`${biomaActual.color}00`, `${biomaActual.color}55`, `${biomaActual.color}00`]}
              end={{ x: 1, y: 0 }}
              start={{ x: 0, y: 0 }}
              style={s.slide1SeparadorLinea}
            />

            <Texto style={s.slide1Subtitulo}>
              {t('onboarding.intro.slide2.subtitle')}
            </Texto>
          </View>
          </>}
        </View>

        {/* SLIDE 3: VARIEDAD DE ÁRBOLES ÚNICOS */}
        <View style={[s.slide, { width, paddingTop: insets.top + 48 }]}>
          {debeMontarSlide(2) && <>
          {/* Tarjeta de bioma: el árbol adulto y sus piezas de crecimiento comparten escena. */}
          <View style={s.tarjetaBiomaHero}>
            <Image resizeMode="contain" source={especieActual.etapa5} style={s.tarjetaBiomaEtapa5} />
            <Image resizeMode="contain" source={especieActual.imagen} style={s.tarjetaBiomaEtapa7} />
            <Image resizeMode="contain" source={especieActual.arbusto} style={s.tarjetaBiomaArbusto} />
            <Image resizeMode="contain" source={especieActual.flor} style={s.tarjetaBiomaFlor} />
            <Image resizeMode="contain" source={especieActual.semilla} style={s.tarjetaBiomaSemilla} />
          </View>

          {/* Controles de la especie fuera del árbol */}
          <View style={s.slide2Controles}>
            <Rebote
              accessibilityLabel={t('onboarding.intro.slide3.prevSpecies')}
              estilo={s.carruselFlechaBoton}
              onPress={() => {
                hapticSeguro('seleccion');
                setIndiceEspecie((prev) => (prev - 1 + ESPECIES_DEMO.length) % ESPECIES_DEMO.length);
              }}
            >
              <MasterGlass style={s.carruselFlechaGlass}>
                <ChevronLeft color={especieActual.color} size={20} strokeWidth={2.6} />
              </MasterGlass>
            </Rebote>

            <Rebote
              accessibilityLabel={t('onboarding.intro.slide3.currentSpecies', { nombre: especieActual.nombre })}
              estilo={s.carruselInsignia}
              onPress={() => {
                hapticSeguro('seleccion');
                setIndiceEspecie((prev) => (prev + 1) % ESPECIES_DEMO.length);
              }}
            >
              <MasterGlass colorBase={especieActual.color} style={s.carruselInsigniaGlass}>
                <Image
                  resizeMode="contain"
                  source={especieActual.gema}
                  style={s.carruselInsigniaGema}
                />
                <Texto style={[s.carruselInsigniaTexto, { color: especieActual.color }]}>
                  {especieActual.nombre} · {t(`onboarding.intro.slide3.speciesTypes.${especieActual.tipoClave}`)}
                </Texto>
              </MasterGlass>
            </Rebote>

            <Rebote
              accessibilityLabel={t('onboarding.intro.slide3.nextSpecies')}
              estilo={s.carruselFlechaBoton}
              onPress={() => {
                hapticSeguro('seleccion');
                setIndiceEspecie((prev) => (prev + 1) % ESPECIES_DEMO.length);
              }}
            >
              <MasterGlass style={s.carruselFlechaGlass}>
                <ChevronRight color={especieActual.color} size={20} strokeWidth={2.6} />
              </MasterGlass>
            </Rebote>

            <View style={s.carruselPuntos}>
              {ESPECIES_DEMO.map((esp, idx) => {
                const activo = idx === indiceEspecie;
                return (
                  <Pressable
                    hitSlop={8}
                    key={esp.nombre}
                    onPress={() => {
                      hapticSeguro('seleccion');
                      setIndiceEspecie(idx);
                    }}
                  >
                    <View
                      style={[
                        s.carruselPunto,
                        activo && [s.carruselPuntoActivo, { backgroundColor: esp.color }],
                      ]}
                    />
                  </Pressable>
                );
              })}
            </View>
          </View>

          {/* Textos inferiores alineados con la identidad de Slide 1 */}
          <View style={s.slide1Textos}>
            <Texto
              adjustsFontSizeToFit
              minimumFontScale={0.82}
              numberOfLines={1}
              style={[
                s.slide1Titulo,
                {
                  fontSize: Math.min(46, Math.max(38, Math.round((width - 32) * 0.125))),
                  letterSpacing: -0.9,
                  lineHeight: altoTituloHero,
                  width: '90%',
                },
              ]}
            >
              {t('onboarding.intro.slide3.title')}
            </Texto>

            <View style={s.slide1TituloFila}>
              <Image
                key={`arbusto-izq-${especieActual.nombre}`}
                resizeMode="contain"
                source={especieActual.arbusto}
                style={[
                  s.slide1ArbustoIzquierdo,
                  { height: altoSubtituloHero, width: altoSubtituloHero },
                ]}
              />
              <MasterText
                coloresGradiente={especieActual.degradadoTexto}
                gradiente={true}
                style={[s.slide1TituloGradiente, { fontSize: tamanoSubtituloHero, lineHeight: altoSubtituloHero }]}
                variante="titulo"
              >
                {t('onboarding.intro.slide3.accent')}
              </MasterText>
              <Image
                key={`arbusto-der-${especieActual.nombre}`}
                resizeMode="contain"
                source={especieActual.arbusto}
                style={[
                  s.slide1ArbustoDerecho,
                  { height: altoSubtituloHero, width: altoSubtituloHero },
                ]}
              />
            </View>

            {/* Separador de línea orgánico suave sincronizado con el color de la especie */}
            <LinearGradient
              colors={[`${especieActual.color}00`, `${especieActual.color}55`, `${especieActual.color}00`]}
              end={{ x: 1, y: 0 }}
              start={{ x: 0, y: 0 }}
              style={s.slide1SeparadorLinea}
            />

            <Texto style={s.slide1Subtitulo}>
              {t('onboarding.intro.slide3.subtitle')}
            </Texto>
          </View>
          </>}
        </View>

        {/* SLIDE 4: EVOLUCIÓN DEL HÁBITO */}
        <View style={[s.slide, { width, paddingTop: insets.top + 48 }]}>
          {debeMontarSlide(3) && <>
          <AuroraBoreal tema="verde" />
          <View style={s.slide4Timeline}>
            <View style={s.slide4LineaTimeline} />
            {[
              { dia: t('onboarding.intro.slide4.day1'), etapa: 1, imagen: require('../../../../assets/ilustraciones/senderos/biomas/paquetes/Esmeralda/etapa1.png') },
              { dia: t('onboarding.intro.slide4.day9'), etapa: 3, imagen: require('../../../../assets/ilustraciones/senderos/biomas/paquetes/Esmeralda/etapa3.png') },
              { dia: t('onboarding.intro.slide4.day27'), etapa: 5, imagen: require('../../../../assets/ilustraciones/senderos/biomas/paquetes/Esmeralda/etapa5.png') },
            ].map((hito) => (
              <View key={hito.etapa} style={s.slide4HitoTimeline}>
                <View style={s.slide4HitoContenido}>
                  <Image resizeMode="contain" source={hito.imagen} style={hito.etapa === 5 ? s.slide4ArbolFinal : hito.etapa === 3 ? s.slide4ArbolMedio : s.slide4ArbolInicio} />
                  <View style={s.slide4PuntoTimeline} />
                  <View style={s.slide4EtiquetaHito}><Texto style={s.slide4DiaTimeline}>{hito.dia}</Texto><Texto style={s.slide4NivelTimeline}>{t('onboarding.intro.slide4.level', { level: hito.etapa })}</Texto></View>
                </View>
              </View>
            ))}
          </View>

          <View style={s.slide4Textos}>
            <Texto
              adjustsFontSizeToFit
              minimumFontScale={0.82}
              numberOfLines={1}
              style={[
                s.slide1Titulo,
                {
                  fontSize: Math.min(46, Math.max(38, Math.round((width - 32) * 0.125))),
                  letterSpacing: -0.9,
                  lineHeight: altoTituloHero,
                  width: '90%',
                },
              ]}
            >
              {t('onboarding.intro.slide4.title')}
            </Texto>

            <View style={s.slide1TituloFila}>
              <Image resizeMode="contain" source={require('../../../../assets/ilustraciones/senderos/biomas/paquetes/Esmeralda/arbusto.png')} style={[s.slide1ArbustoIzquierdo, { height: altoSubtituloHero, width: altoSubtituloHero }]} />
              <MasterText coloresGradiente={DEGRADADO_VERDE_SUTIL} gradiente style={[s.slide1TituloGradiente, { fontSize: tamanoSubtituloHero, lineHeight: altoSubtituloHero }]} variante="titulo">{t('onboarding.intro.slide4.accent')}</MasterText>
              <Image resizeMode="contain" source={require('../../../../assets/ilustraciones/senderos/biomas/paquetes/Esmeralda/arbusto.png')} style={[s.slide1ArbustoDerecho, { height: altoSubtituloHero, width: altoSubtituloHero }]} />
            </View>
            <LinearGradient
              colors={[conAlfa(esc.jade.l50, 0), conAlfa(esc.jade.l50, 0.32), conAlfa(esc.jade.l50, 0)]}
              end={{ x: 1, y: 0 }}
              start={{ x: 0, y: 0 }}
              style={s.slide1SeparadorLinea}
            />
            <Texto style={s.slide1Subtitulo}>
              {t('onboarding.intro.slide4.subtitle')}
            </Texto>
          </View>
          </>}
        </View>

        {/* SLIDE 5: INICIAR SESIÓN */}
        <View style={[s.slide, { width, paddingTop: insets.top + 48 }]}>
          {debeMontarSlide(4) && <>
          <AuroraBoreal tema="verde" />

          <View style={s.slide5Contenido}>
            <MasterGlass style={s.slide5Panel}>
              <View style={s.slide5Hero}>
                <Image
                  resizeMode="contain"
                  source={require('../../../../assets/ilustraciones/senderos/biomas/paquetes/Esmeralda/arbusto.png')}
                  style={s.slide5Arbol}
                />
              </View>

              <Texto style={s.slide5Titulo}>{t('onboarding.intro.slide5.title')}</Texto>
              <Texto style={s.slide5Subtitulo}>{t('onboarding.intro.slide5.subtitle')}</Texto>

              <LinearGradient
                colors={[conAlfa(esc.jade.l50, 0), conAlfa(esc.jade.l50, 0.32), conAlfa(esc.jade.l50, 0)]}
                end={{ x: 1, y: 0 }}
                start={{ x: 0, y: 0 }}
                style={s.slide5Separador}
              />

              <ScrollView contentContainerStyle={s.slide5FormularioScroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false} style={s.slide5FormularioContenedor}>
                <FormularioAccesoOnboarding />
              </ScrollView>
            </MasterGlass>
          </View>
          </>}
        </View>
      </ScrollView>

      {/* Pie de Página Fijo con Indicadores de Pasos y Botón MasterButton — el
          botón genérico no aplica en el slide del login (ahí la acción real
          es enviar el formulario, no "ir al siguiente slide"), solo quedan
          los puntos de progreso. */}
      <View style={[s.pie, { paddingBottom: insets.bottom + 18 }]}>
        <View style={s.puntos}>
          {Array.from({ length: totalSlides }).map((_, indice) => {
            const activo = indice === slideActivo;
            return (
              <View
                key={indice}
                style={[
                  s.punto,
                  activo && s.puntoActivo,
                  activo && { backgroundColor: C.verde },
                ]}
              />
            );
          })}
        </View>

        {!esUltima && (
          <MasterButton
            color={esc.hoja.l61a}
            onPress={siguiente}
            iconoDerecha={({ size }) => <ChevronRight color="#FFFFFF" size={size} strokeWidth={3} />}
            style={s.botonSiguiente}
          >
            {t('onboarding.intro.continue')}
          </MasterButton>
        )}
      </View>
    </KeyboardAvoidingView>
  );
}

const crearEstilosS = (esc: EscalaMaster) => StyleSheet.create({
  raiz: {
    flex: 1,
  },
  slide5Contenido: { alignItems: 'center', flex: 1, justifyContent: 'flex-end', paddingHorizontal: 24, width: '100%' },
  slide5Panel: { alignItems: 'center', paddingHorizontal: 24, paddingVertical: 28, width: '100%' },
  slide5Hero: { alignItems: 'center', height: 85, justifyContent: 'center', marginBottom: -6, width: 110 },
  slide5Separador: { alignSelf: 'center', borderRadius: 1, height: 1.5, marginTop: 8, width: 64 },
  slide5Arbol: { height: 70, width: 70 },
  slide5Titulo: { color: C.texto, fontFamily: 'MontserratAlternates-Bold', fontSize: 24, textAlign: 'center', width: '100%' },
  slide5Subtitulo: { color: C.tenue, fontFamily: 'Montserrat-Medium', fontSize: 13, lineHeight: 18, marginTop: 4, textAlign: 'center', width: '100%' },
  slide5FormularioContenedor: { marginTop: 20, width: '100%' },
  slide5FormularioScroll: { paddingHorizontal: 24, paddingBottom: 24 },
  barraTope: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'flex-end',
    left: 20,
    position: 'absolute',
    right: 20,
    zIndex: 20,
  },
  omitirGlass: {
    alignItems: 'center',
    borderRadius: 20,
    flexDirection: 'row',
    gap: 3,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  omitirTexto: {
    color: C.tenue,
    fontFamily: 'Montserrat-Bold',
    fontSize: 13,
  },
  slide: {
    alignItems: 'center',
    flex: 1,
  },
  slideCentrado: {
    justifyContent: 'center',
  },
  // Slide 1 nuevo layout
  slide1HeroArbol: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    marginTop: 8,
    position: 'relative',
    width: '100%',
  },
  slide1ArbolFondosImg: {
    height: '98%',
    maxHeight: 375,
    width: '96%',
    zIndex: 2,
  },
  slide1Terreno: {
    bottom: 32,
    height: 82,
    left: '5%',
    position: 'absolute',
    right: '5%',
    zIndex: 1,
  },
  terrenoPieza: {
    position: 'absolute',
  },
  terrenoRocaIzquierda: {
    bottom: 4,
    height: 50,
    left: 2,
    width: 58,
  },
  terrenoPastoIzquierdo: {
    bottom: 0,
    height: 42,
    left: 34,
    width: 52,
  },
  terrenoRocaDerecha: {
    bottom: 1,
    height: 66,
    right: 0,
    width: 76,
  },
  terrenoPastoDerecho: {
    bottom: 0,
    height: 44,
    right: 42,
    width: 54,
  },
  slide1TituloFila: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    width: '100%',
  },
  slide1ArbustoIzquierdo: {
    marginRight: 10,
    transform: [{ scaleX: -1 }],
  },
  slide1ArbustoDerecho: {
    marginLeft: 10,
  },
  flotanteRocaTop: { height: 32, left: 36, position: 'absolute', top: '15%', width: 32, zIndex: 1 },
  flotantePastoTop: { height: 32, position: 'absolute', right: 40, top: '12%', width: 36, zIndex: 1 },
  flotanteRocaMid: { height: 26, left: 30, position: 'absolute', top: '55%', width: 26, zIndex: 1 },
  imgFlotante: { height: '100%', width: '100%' },
  slide1Textos: {
    alignItems: 'center',
    marginBottom: 20,
    paddingHorizontal: 16,
    width: '100%',
  },
  slide1Titulo: {
    color: '#1A1335',
    fontFamily: 'MontserratAlternates-Bold',
    letterSpacing: -0.8,
    textAlign: 'center',
  },
  slide1TituloGradiente: {
    fontFamily: 'MontserratAlternates-Bold',
    letterSpacing: -0.8,
    marginTop: 0,
    textAlign: 'center',
  },
  slide1SeparadorLinea: {
    borderRadius: 1,
    height: 1.5,
    marginVertical: 14,
    width: 64,
  },
  slide1Subtitulo: {
    color: C.tenue,
    fontFamily: 'Montserrat-Medium',
    fontSize: 15,
    lineHeight: 22,
    maxWidth: 330,
    textAlign: 'center',
  },
  slide2HeroMapa: {
    alignItems: 'center',
    flex: 0,
    justifyContent: 'center',
    marginBottom: 6,
    marginTop: 8,
    position: 'relative',
    width: '100%',
  },
  slide2TerrenoBase: {
    bottom: 24,
    height: 82,
    left: '5%',
    position: 'absolute',
    right: '5%',
    zIndex: 1,
  },
  tarjetaBiomaHero: {
    alignSelf: 'center',
    height: 332,
    marginTop: 8,
    position: 'relative',
    width: '88%',
  },
  tarjetaBiomaEtapa7: {
    bottom: -2,
    height: 300,
    position: 'absolute',
    right: '50%',
    transform: [{ translateX: 150 }],
    width: 300,
    zIndex: 3,
  },
  tarjetaBiomaEtapa5: {
    bottom: 28,
    height: 150,
    left: -12,
    opacity: 0.92,
    position: 'absolute',
    width: 150,
    zIndex: 2,
  },
  tarjetaBiomaArbusto: {
    bottom: 18,
    height: 70,
    left: 16,
    position: 'absolute',
    width: 70,
    zIndex: 5,
  },
  tarjetaBiomaFlor: {
    bottom: 32,
    height: 54,
    position: 'absolute',
    right: 20,
    width: 54,
    zIndex: 5,
  },
  tarjetaBiomaSemilla: {
    height: 48,
    position: 'absolute',
    right: 20,
    top: 64,
    width: 48,
    zIndex: 5,
  },
  slide2MapaMarco: {
    backgroundColor: 'rgba(255, 255, 255, 0.48)',
    borderColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 28,
    borderWidth: 1,
    elevation: 4,
    height: '100%',
    overflow: 'hidden',
    shadowColor: esc.jade.l29,
    shadowOffset: { height: 8, width: 0 },
    shadowOpacity: 0.12,
    shadowRadius: 14,
    width: '88%',
    zIndex: 2,
  },
  mapaContenedor: {
    height: '100%',
    maxHeight: 385,
    overflow: 'hidden',
    position: 'relative',
    width: '100%',
    zIndex: 2,
  },
  mapaDegradadoTope: {
    height: 40,
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
    zIndex: 2,
  },
  mapaDegradadoPiso: {
    bottom: 0,
    height: 60,
    left: 0,
    position: 'absolute',
    right: 0,
    zIndex: 2,
  },
  slide2Controles: {
    alignItems: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginBottom: 6,
    paddingHorizontal: 24,
    width: '100%',
  },
  carruselInsignia: {
    marginHorizontal: 14,
  },
  carruselInsigniaGlass: {
    alignItems: 'center',
    borderColor: 'rgba(255, 255, 255, 0.85)',
    borderRadius: 20,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  carruselInsigniaEmoji: {
    fontSize: 13,
    lineHeight: 16,
  },
  carruselInsigniaGema: {
    height: 20,
    width: 20,
  },
  carruselInsigniaTexto: {
    fontFamily: 'Montserrat-Bold',
    fontSize: 12,
    letterSpacing: 0.2,
  },
  carruselFlechaBoton: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  carruselFlechaGlass: {
    alignItems: 'center',
    borderColor: 'rgba(255, 255, 255, 0.85)',
    borderRadius: 20,
    borderWidth: 1,
    height: 38,
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    width: 38,
    elevation: 3,
  },
  carruselPuntos: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 6,
    justifyContent: 'center',
    marginTop: 8,
    width: '100%',
  },
  carruselPunto: {
    backgroundColor: conAlfa(esc.hoja.l22, 0.22),
    borderRadius: 3,
    height: 6,
    width: 6,
  },
  carruselPuntoActivo: {
    borderRadius: 3,
    height: 6,
    width: 18,
  },
  slide4GemaCentralContenedor: {
    alignItems: 'center',
    height: 260,
    justifyContent: 'center',
    position: 'relative',
    width: 260,
    zIndex: 2,
  },
  slide4HeroRecompensas: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    position: 'relative',
    width: '100%',
  },
  slide4Timeline: {
    alignItems: 'center',
    flexDirection: 'row',
    flex: 1,
    minHeight: 280,
    justifyContent: 'space-between',
    paddingHorizontal: 22,
    position: 'relative',
    width: '100%',
  },
  slide4LineaTimeline: {
    backgroundColor: conAlfa(esc.jade.l50, 0.38),
    borderRadius: 3,
    bottom: 54,
    height: 3,
    left: '15%',
    position: 'absolute',
    right: '15%',
  },
  slide4HitoTimeline: {
    alignItems: 'center',
    flex: 1,
    height: '100%',
    justifyContent: 'center',
    zIndex: 2,
  },
  slide4PuntoTimeline: {
    backgroundColor: esc.jade.l50,
    borderColor: '#FFFFFF',
    borderRadius: 9,
    borderWidth: 3,
    elevation: 3,
    height: 18,
    marginVertical: 6,
    width: 18,
  },
  slide4PuntoFinal: {
    backgroundColor: '#EAB308',
    height: 24,
    marginVertical: 3,
    width: 24,
  },
  slide4ArbolInicio: {
    height: 82,
    transform: [{ scale: 1.12 }],
    width: 82,
  },
  slide4ArbolMedio: {
    height: 118,
    transform: [{ scale: 1.16 }],
    width: 118,
  },
  slide4ArbolFinal: {
    height: 160,
    transform: [{ scale: 1.14 }],
    width: 160,
  },
  slide4DiaTimeline: {
    color: C.texto,
    fontFamily: 'Montserrat-Bold',
    fontSize: 12,
    marginBottom: 1,
  },
  slide4NivelTimeline: {
    color: C.tenue,
    fontFamily: 'Montserrat-Medium',
    fontSize: 11,
  },
  slide4EtiquetaHito: {
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.72)',
    borderColor: conAlfa(esc.jade.l50, 0.12),
    borderRadius: 12,
    borderWidth: 1,
    minWidth: 62,
    paddingHorizontal: 8,
    paddingVertical: 5,
  },
  slide4HitoContenido: {
    alignItems: 'center',
    flex: 1,
    height: 238,
    justifyContent: 'flex-end',
  },
  slide4RecompensaRacha: {
    left: 24,
    position: 'absolute',
    top: '19%',
    zIndex: 5,
  },
  slide4RecompensaSemilla: {
    position: 'absolute',
    right: 24,
    top: '26%',
    zIndex: 5,
  },
  slide4RecompensaBioma: {
    bottom: '14%',
    position: 'absolute',
    right: 36,
    zIndex: 5,
  },
  slide4Textos: {
    alignItems: 'center',
    marginBottom: 20,
    marginTop: 36,
    paddingHorizontal: 16,
    width: '100%',
  },
  slide4GemaHeroImg: {
    height: 172,
    width: 172,
    zIndex: 2,
  },
  slide4PillRachaFlotante: {
    left: 20,
    position: 'absolute',
    top: '20%',
    zIndex: 5,
  },
  slide4PillNivelFlotante: {
    position: 'absolute',
    right: 20,
    top: '20%',
    zIndex: 5,
  },
  slide4StatGlass: {
    alignItems: 'center',
    borderColor: 'rgba(255, 255, 255, 0.85)',
    borderRadius: 20,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 7,
    paddingHorizontal: 14,
    paddingVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  slide4StatTexto: {
    color: '#1A1335',
    fontFamily: 'Montserrat-Bold',
    fontSize: 12,
  },
  slide4StatNumero: {
    color: '#1A1335',
    fontFamily: 'Montserrat-Bold',
    fontSize: 14,
    lineHeight: 16,
  },
  slide4SemillaIcono: {
    height: 28,
    width: 28,
  },
  slide4SparkleFlotante: {
    position: 'absolute',
    right: 36,
    top: '58%',
    zIndex: 5,
  },
  slide4MiniSparkleGlass: {
    alignItems: 'center',
    borderColor: 'rgba(255, 255, 255, 0.85)',
    borderRadius: 18,
    borderWidth: 1,
    height: 36,
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    width: 36,
    elevation: 3,
  },
  pie: {
    gap: 16,
    paddingHorizontal: 24,
    paddingTop: 12,
  },
  puntos: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 7,
    justifyContent: 'center',
  },
  punto: {
    backgroundColor: conAlfa(esc.jade.l50, 0.25),
    borderRadius: 4,
    height: 7,
    width: 7,
  },
  puntoActivo: {
    borderRadius: 5,
    width: 24,
  },
  botonSiguiente: {
    height: 56,
    width: '100%',
  },
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
