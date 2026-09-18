import { useEffect, useRef, useState } from 'react';
import {
  Image,
  type ImageSourcePropType,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  ScrollView,
  StyleSheet,
  useWindowDimensions,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
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
  Users,
} from 'lucide-react-native';

import {
  MasterButton,
  MasterGlass,
  MasterIcon,
  MasterIconBg,
  MasterKicker,
  MasterProgressbar,
  MasterText,
  Rebote,
  Texto,
} from '../../../diseno';
import { colorMasterMasCercano } from '../../../diseno/componentes/MasterChanger';
import { hapticSeguro } from '../../../nucleo/dispositivo/haptics';
import { AuroraBoreal } from '../../hoy/componentes/AuroraBoreal';
import { ContenedorMapaSenderos } from '../../senderos/componentes/mapa/ContenedorMapaSenderos';
import type { NodoMapaSendero } from '../../senderos/datos/mapaEjercicio.mock';
import { marcarIntroduccionAppVista } from '../introduccionApp';

// Paleta Light de HabitosPantalla / InsightsPantalla
const C = {
  fondo: '#F7FDF7',
  texto: '#1A1335',
  tenue: '#648170',
  verde: '#25884C',
  verdeSombra: '#12331F',
  dorado: '#EAB308',
  morado: '#8B5CF6',
  glass: 'rgba(255,255,255,0.78)',
  glassBorde: 'rgba(255,255,255,0.85)',
};

// Variación mínima para que el énfasis se sienta orgánico, no llamativo.
const DEGRADADO_VERDE_SUTIL = ['#2B8E4D', '#25884C', '#207F45'] as const;

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

// Muestra de árboles con datos de estilo
const ARBOLES_MUESTRA = [
  {
    color: '#FFD000',
    nombre: 'Aurelia',
    tipo: 'Brillo Solar',
    imagen: require('../../../../assets/ilustraciones/senderos/biomas/paquetes/aurelia/etapa7.png'),
  },
  {
    color: '#80B0E0',
    nombre: 'Diamante',
    tipo: 'Cristal Celeste',
    imagen: require('../../../../assets/ilustraciones/senderos/biomas/paquetes/diamante/etapa7.png'),
  },
  {
    color: '#FC70AF',
    nombre: 'Sakura',
    tipo: 'Flor de Cerezo',
    imagen: require('../../../../assets/ilustraciones/senderos/biomas/paquetes/Sakura/etapa7.png'),
  },
  {
    color: '#FCB103',
    nombre: 'Golden',
    tipo: 'Follaje Dorado',
    imagen: require('../../../../assets/ilustraciones/senderos/biomas/paquetes/Golden/etapa7.png'),
  },
] as const;

function construirNodosDemo(): NodoMapaSendero[] {
  return Array.from({ length: 10 }, (_, indice) => ({
    estado: indice < 4 ? 'completado' : indice === 4 ? 'activo' : 'bloqueado',
    icono: Check,
    id: `intro-demo-${indice}`,
    subtitulo: `Día ${indice + 1}`,
    titulo: `Día ${indice + 1}`,
  }));
}

export function IntroduccionAppPantalla() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const [slideActivo, setSlideActivo] = useState(0);
  const scrollRef = useRef<ScrollView>(null);
  const nodosDemo = useRef(construirNodosDemo()).current;
  const totalSlides = 4;
  const esUltima = slideActivo === totalSlides - 1;
  const tamanoTituloHero = Math.min(48, Math.max(40, Math.round((width - 32) * 0.116)));
  const altoTituloHero = tamanoTituloHero + 8;
  const tamanoSubtituloHero = Math.min(38, Math.max(30, Math.round(tamanoTituloHero * 0.8)));
  const altoSubtituloHero = tamanoSubtituloHero + 7;

  async function terminar() {
    await marcarIntroduccionAppVista();
    router.replace('/(publico)/iniciar-sesion');
  }

  function alScroll(evento: NativeSyntheticEvent<NativeScrollEvent>) {
    const indice = Math.round(evento.nativeEvent.contentOffset.x / width);
    if (indice !== slideActivo && indice >= 0 && indice < totalSlides) {
      setSlideActivo(indice);
    }
  }

  function siguiente() {
    hapticSeguro('seleccion');
    if (esUltima) {
      terminar();
      return;
    }
    scrollRef.current?.scrollTo({ x: (slideActivo + 1) * width, animated: true });
  }

  return (
    <View style={s.raiz}>
      {/* Fondo Light Ambiental Unificado */}
      <LinearGradient
        colors={['#F7FDF7', '#E8F7E9', '#D5F2D7']}
        end={{ x: 0, y: 1 }}
        start={{ x: 0, y: 0 }}
        style={StyleSheet.absoluteFill}
      />

      {/* Botón Omitir Superior Flotante con MasterGlass */}
      <View style={[s.barraTope, { top: insets.top + 10 }]}>
        <Rebote accessibilityLabel="Omitir introducción" onPress={terminar}>
          <MasterGlass style={s.omitirGlass}>
            <Texto style={s.omitirTexto}>Omitir</Texto>
            <ChevronRight color={C.tenue} size={15} strokeWidth={2.5} />
          </MasterGlass>
        </Rebote>
      </View>

      <ScrollView
        bounces={false}
        horizontal
        onScroll={alScroll}
        pagingEnabled
        ref={scrollRef}
        scrollEventThrottle={32}
        showsHorizontalScrollIndicator={false}
        style={{ flex: 1 }}
      >
        {/* SLIDE 1: IDENTIDAD Y MARCA LESTINATY */}
        <View style={[s.slide, { width, paddingTop: insets.top + 48 }]}>
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
              Cultiva tu vida
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
                que quieres
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
              colors={['rgba(37,136,76,0)', 'rgba(37,136,76,0.32)', 'rgba(37,136,76,0)']}
              end={{ x: 1, y: 0 }}
              start={{ x: 0, y: 0 }}
              style={s.slide1SeparadorLinea}
            />

            <Texto style={s.slide1Subtitulo}>
              Cada hábito diario nutre tus metas y hace crecer tu propio árbol vivo paso a paso.
            </Texto>
          </View>
        </View>

        {/* SLIDE 2: EL SENDERO Y MAPA VIVO EN TIEMPO REAL */}
        <View style={[s.slide, { width, paddingTop: insets.top + 48 }]}>
          <AuroraBoreal tema="verde" />

          {/* Hero Central: Ventana de Mapa Real con Degradados Líquidos y elementos ambientales */}
          <View style={s.slide2HeroMapa}>
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

            <View pointerEvents="none" style={s.mapaContenedor}>
              <ContenedorMapaSenderos
                altura={370}
                categoriaId="habitos"
                color="#029060"
                enfocado={false}
                nivel={4}
                nodos={nodosDemo}
                paqueteId="esmeralda"
                subcategoriaId="intro-demo"
              />
              <LinearGradient
                colors={['#F7FDF7', 'rgba(247,253,247,0)']}
                style={s.mapaDegradadoTope}
              />
              <LinearGradient
                colors={['rgba(213,242,215,0)', '#D5F2D7']}
                style={s.mapaDegradadoPiso}
              />
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
              Avanza cada día
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
                en tu sendero
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

            {/* Separador de línea orgánico suave idéntico a Slide 1 */}
            <LinearGradient
              colors={['rgba(37,136,76,0)', 'rgba(37,136,76,0.32)', 'rgba(37,136,76,0)']}
              end={{ x: 1, y: 0 }}
              start={{ x: 0, y: 0 }}
              style={s.slide1SeparadorLinea}
            />

            <Texto style={s.slide1Subtitulo}>
              Cruza nuevos biomas y desbloquea recompensas vivas al completar tus hábitos.
            </Texto>
          </View>
        </View>

        {/* SLIDE 3: VARIEDAD DE ÁRBOLES ÚNICOS */}
        <View style={[s.slide, s.slideCentrado, { width, paddingTop: insets.top + 64 }]}>
          <View style={s.slideTextoBloque}>
            <View style={s.kickerFila}>
              <MasterKicker
                icono={<MasterIcon color={2} name="hoja3" size={12} />}
                texto="ESPECIES Y BIOMAS"
              />
            </View>
            <Texto style={s.slideTitulo}>Elegí entre árboles únicos</Texto>
            <Texto style={s.slideSubtitulo}>
              Cada árbol tiene su propia personalidad, paleta cromática y 7 etapas de evolución artesanal.
            </Texto>
          </View>

          {/* Grilla 2x2 de Árboles en MasterGlass */}
          <View style={s.arbolesGrilla}>
            {ARBOLES_MUESTRA.map((arbol) => (
              <MasterGlass
                colorBase={arbol.color}
                key={arbol.nombre}
                style={s.tarjetaArbolGlass}
              >
                <View style={[s.puntoArbolAura, { backgroundColor: `${arbol.color}24` }]}>
                  <Image
                    resizeMode="contain"
                    source={arbol.imagen}
                    style={s.imagenArbolChico}
                  />
                </View>
                <Texto style={s.nombreArbol}>{arbol.nombre}</Texto>
                <Texto style={s.tipoArbol}>{arbol.tipo}</Texto>
              </MasterGlass>
            ))}
          </View>
        </View>

        {/* SLIDE 4: GEMAS, RACHA Y RECOMPENSAS */}
        <View style={[s.slide, s.slideCentrado, { width, paddingTop: insets.top + 64 }]}>
          <View style={s.slideTextoBloque}>
            <View style={s.kickerFila}>
              <MasterKicker
                icono={<MasterIcon color={3} name="trofeo" size={12} />}
                texto="LOGROS Y RECOMPENSAS"
              />
            </View>
            <Texto style={s.slideTitulo}>Ganá gemas y superá tu racha</Texto>
            <Texto style={s.slideSubtitulo}>
              Completa hábitos para obtener gemas, canjear semillas exóticas y competir amigablemente con tus amigos.
            </Texto>
          </View>

          {/* Tarjeta Hero de Recompensa */}
          <View style={s.slide4HeroContenedor}>
            <MasterGlass style={s.gemaHeroGlass}>
              <View style={s.gemaAuraSvg}>
                <Svg height={160} style={StyleSheet.absoluteFill} width={160}>
                  <Defs>
                    <RadialGradient cx="50%" cy="50%" id="brilloGema" r="50%">
                      <Stop offset="0%" stopColor="rgba(168, 85, 247, 0.35)" />
                      <Stop offset="100%" stopColor="transparent" />
                    </RadialGradient>
                  </Defs>
                  <Circle cx={80} cy={80} fill="url(#brilloGema)" r={75} />
                </Svg>
                <Image
                  resizeMode="contain"
                  source={require('../../../../assets/icons/hoy/gemas.png')}
                  style={s.iconoGemaHero}
                />
              </View>

              <View style={s.statsFilaHero}>
                <View style={s.statHeroPill}>
                  <Flame color="#F97316" fill="#F97316" size={16} />
                  <Texto style={s.statHeroTexto}>Rachas activas</Texto>
                </View>
                <View style={s.statHeroPill}>
                  <Trophy color="#EAB308" size={16} />
                  <Texto style={s.statHeroTexto}>Nivel de maestría</Texto>
                </View>
              </View>
            </MasterGlass>
          </View>
        </View>
      </ScrollView>

      {/* Pie de Página Fijo con Indicadores de Pasos y Botón MasterButton */}
      <View style={[s.pie, { paddingBottom: insets.bottom + 18 }]}>
        {/* Puntos / Indicador de Progreso */}
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

        {/* Botón CTA de Alta Conversión */}
        <MasterButton
          color="#21A844"
          onPress={siguiente}
          iconoDerecha={esUltima ? undefined : ({ size }) => <ChevronRight color="#FFFFFF" size={size} strokeWidth={3} />}
          style={s.botonSiguiente}
        >
          {esUltima ? '¡COMENZAR MI JARDÍN!' : 'CONTINUAR'}
        </MasterButton>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  raiz: {
    flex: 1,
  },
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
  slideTextoBloque: {
    alignItems: 'center',
    paddingHorizontal: 24,
    width: '100%',
  },
  kickerFila: {
    alignItems: 'center',
    marginBottom: 8,
  },
  slideTitulo: {
    color: C.texto,
    fontFamily: 'MontserratAlternates-Bold',
    fontSize: 24,
    lineHeight: 30,
    textAlign: 'center',
  },
  slideSubtitulo: {
    color: C.tenue,
    fontFamily: 'Montserrat-Medium',
    fontSize: 13,
    lineHeight: 18,
    marginTop: 8,
    maxWidth: 320,
    textAlign: 'center',
  },
  slide2HeroMapa: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
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
  arbolesGrilla: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'center',
    marginTop: 20,
    paddingHorizontal: 20,
    width: '100%',
  },
  tarjetaArbolGlass: {
    alignItems: 'center',
    borderRadius: 22,
    padding: 14,
    width: '46%',
  },
  puntoArbolAura: {
    alignItems: 'center',
    borderRadius: 40,
    height: 80,
    justifyContent: 'center',
    width: 80,
  },
  imagenArbolChico: {
    height: 74,
    width: 74,
  },
  nombreArbol: {
    color: C.texto,
    fontFamily: 'MontserratAlternates-Bold',
    fontSize: 15,
    marginTop: 8,
  },
  tipoArbol: {
    color: C.tenue,
    fontFamily: 'Montserrat-Medium',
    fontSize: 11,
    marginTop: 2,
  },
  slide4HeroContenedor: {
    marginTop: 24,
    paddingHorizontal: 24,
    width: '100%',
  },
  gemaHeroGlass: {
    alignItems: 'center',
    borderRadius: 28,
    paddingVertical: 24,
    width: '100%',
  },
  gemaAuraSvg: {
    alignItems: 'center',
    height: 140,
    justifyContent: 'center',
    position: 'relative',
    width: 140,
  },
  iconoGemaHero: {
    height: 84,
    width: 84,
    zIndex: 2,
  },
  statsFilaHero: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 18,
  },
  statHeroPill: {
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.65)',
    borderColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  statHeroTexto: {
    color: C.texto,
    fontFamily: 'Montserrat-Bold',
    fontSize: 12,
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
    backgroundColor: 'rgba(37, 136, 76, 0.25)',
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
