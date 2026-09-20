import { useEffect, useRef, useState } from 'react';
import { Image, StyleSheet, useWindowDimensions, View } from 'react-native';
import { ArrowRight } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useVideoPlayer, VideoView } from 'expo-video';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { MasterButton, MasterIcon, MasterText, Texto } from '../../diseno';
import { usarEstadoAcceso } from '../../modulos/acceso/acceso.estado';
import { AuroraBoreal } from '../../modulos/hoy/componentes/AuroraBoreal';
import { ESCALA_ESMERALDA } from '../../diseno/tema/escalaEsmeralda';
import { conAlfa } from '../../diseno/tema/masterColor';

const VIDEO_APERTURA = require('../../../assets/marca/arbusto.mp4');
const ARBUSTO_ESMERALDA = require('../../../assets/ilustraciones/senderos/biomas/paquetes/Esmeralda/arbusto.png');

// Solo cubre el caso de que el video NUNCA llegue a su fin (archivo raro,
// códec no soportado en un dispositivo viejo) — se limpia apenas playToEnd
// dispara de verdad, así no interfiere con que la persona se tome su tiempo
// en la pantalla de bienvenida de después.
const RESPALDO_MS = 14_000;
// Cuánto se queda congelado en el último frame antes de decidir qué sigue —
// le da un respiro intencional al corte en vez de sentirse abrupto. Solo
// aplica al camino de respaldo (ver SEGUNDOS_ANTES_DEL_FIN_PARA_BIENVENIDA).
const CONGELADO_MS = 800;
// El bloque "Bienvenido a Lestinaty" completo (no solo el wordmark) aparece
// ya con el video TODAVÍA reproduciéndose, cuando quedan estos segundos de
// SU duración real — no hace falta esperar a que termine, porque para
// entonces ya sabemos casi siempre si hay sesión o no (el chequeo de auth es
// mucho más rápido que el video entero).
const SEGUNDOS_ANTES_DEL_FIN_PARA_BIENVENIDA = 5;
// Fundido de salida antes de revelar lo que sigue (onboarding o Inicio) —
// sin esto, sacar el overlay era un corte seco de un frame al otro.
const SALIDA_MS = 420;

const DEGRADADO_VERDE_SUTIL = [ESCALA_ESMERALDA.jade.l50, ESCALA_ESMERALDA.jade.l50, ESCALA_ESMERALDA.hoja.l46] as const;
const FONDO_MENTA = [ESCALA_ESMERALDA.hoja.l99, ESCALA_ESMERALDA.hoja.l95, ESCALA_ESMERALDA.hoja.l93] as const;
// Mismo degradado (esquina sup-izq → inf-der) horneado en el fondo de
// arbusto.mp4 — muestreado directo del video en 3 momentos distintos del
// clip (arranca, mitad, casi al final) y da prácticamente el mismo valor en
// los tres, confirmando que es fijo. Al ponerle borderRadius al video, sus 4
// esquinas redondeadas dejan ver un triangulito del fondo de atrás — con
// estos mismos colores ahí detrás, ese triangulito calza matemáticamente con
// el degradado del video en vez de mostrar el mint plano de FONDO_MENTA.
const COLORES_FONDO_VIDEO = [ESCALA_ESMERALDA.jade.l88, ESCALA_ESMERALDA.menta.l83] as const;

// Ciclo de nombres para llenar las 49 celdas de la grid — se repite, no hace
// falta que sean 49 íconos distintos.
const ICONOS_GRID = [
  'sol', 'correr', 'meditar', 'dormir', 'botella', 'manzana', 'cerebro', 'energia',
  'musica', 'corazon', 'trofeo', 'calendario', 'idea', 'montana', 'estudiar', 'camara',
  'flor', 'planta', 'maceta', 'reloj', 'estadistica', 'progreso', 'feliz', 'rayo',
] as const;

const COLUMNAS_GRID = 7;
const FILAS_GRID = 7;
const DURACION_VAIVEN_MS = 7000;

// Una sola grid grande (más ancha que la pantalla a propósito) que se
// desplaza entera en vaivén horizontal — no son íconos flotando cada uno por
// su cuenta, es UN bloque deslizándose de un lado al otro sin parar.
function GridIconosFondo() {
  const { height, width } = useWindowDimensions();
  // El tamaño de celda sale del alto (7 filas cubren la pantalla completa) —
  // como el celular siempre es más alto que ancho, la grid resultante queda
  // bastante más ancha que la pantalla, dando lugar de sobra para el vaivén.
  const tamanoCelda = Math.round((height * 1.08) / FILAS_GRID);
  const anchoGrid = tamanoCelda * COLUMNAS_GRID;
  const desplazamiento = Math.max(80, anchoGrid - width);

  const translateX = useSharedValue(0);
  useEffect(() => {
    translateX.value = withRepeat(
      withSequence(
        withTiming(-desplazamiento, { duration: DURACION_VAIVEN_MS, easing: Easing.inOut(Easing.sin) }),
        withTiming(0, { duration: DURACION_VAIVEN_MS, easing: Easing.inOut(Easing.sin) }),
      ),
      -1,
      true,
    );
  }, [desplazamiento, translateX]);

  const estiloGrid = useAnimatedStyle(() => ({ transform: [{ translateX: translateX.value }] }));
  const celdas = Array.from({ length: COLUMNAS_GRID * FILAS_GRID });

  return (
    <Animated.View style={[s.grid, { width: anchoGrid }, estiloGrid]}>
      {celdas.map((_, indice) => (
        <View key={indice} style={[s.celdaGrid, { height: tamanoCelda, width: tamanoCelda }]}>
          <MasterIcon name={ICONOS_GRID[indice % ICONOS_GRID.length]} size={Math.round(tamanoCelda * 0.45)} />
        </View>
      ))}
    </Animated.View>
  );
}

// Solo describe al VIDEO — la bienvenida (texto + botón opcional) es
// independiente, ver `mostrarBienvenida`/`mostrarBoton` más abajo.
type Fase = 'reproduciendo' | 'congelado';

// Se ve en CADA apertura en frío. Estructura de capas (de atrás para
// adelante): fondo menta + aurora animada + íconos flotantes casi invisibles
// (persisten toda la secuencia, dan continuidad visual) → arbusto.mp4
// centrado. El texto "Bienvenido a Lestinaty" (mismo lenguaje visual que el
// slide 1 del carrusel de introducción, pero con copy propio para no
// repetirlo un momento después) aparece para TODOS — con sesión o sin ella —
// mientras el video TODAVÍA se está reproduciendo, sincronizado a sus
// últimos segundos. La diferencia entre tener sesión o no es lo que pasa
// DESPUÉS de eso: con sesión, el video termina, se congela un instante y
// sigue derecho sin esperar nada (el texto se ve, pero no hay botón); sin
// sesión, aparece además el botón "Comenzar" y ahí sí se espera el toque.
export function AnimacionApertura({ onTerminar }: { onTerminar: () => void }) {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const usuario = usarEstadoAcceso((estado) => estado.usuario);
  const cargandoSesion = usarEstadoAcceso((estado) => estado.cargandoSesion);
  const [fase, setFase] = useState<Fase>('reproduciendo');
  // Independiente de `fase` y de la sesión — el texto se muestra para
  // cualquiera apenas el video llega a sus últimos segundos.
  const [mostrarBienvenida, setMostrarBienvenida] = useState(false);
  // El botón (y la espera del toque) siguen siendo solo para invitados.
  const mostrarBoton = mostrarBienvenida && !cargandoSesion && !usuario;

  const tamanoBienvenidaTitulo = Math.min(48, Math.max(40, Math.round((width - 32) * 0.116)));
  const altoBienvenidaTitulo = tamanoBienvenidaTitulo + 8;
  const tamanoAccento = Math.min(38, Math.max(30, Math.round(tamanoBienvenidaTitulo * 0.8)));
  const altoAccento = tamanoAccento + 7;

  // Un solo punto de salida para los dos casos (logueado: splash → Inicio
  // directo; sin sesión: bienvenida → onboarding al tocar "Comenzar") — acá
  // se dispara el fundido, y recién cuando termina se llama a onTerminar de
  // verdad, revelando lo que ya estaba resuelto por debajo.
  const opacidadSalida = useSharedValue(1);
  const [saliendo, setSaliendo] = useState(false);

  function salir() {
    if (saliendo) return; // evita doble disparo (ej. tocar "Comenzar" dos veces)
    setSaliendo(true);
    // Si tocan "Comenzar" mientras el video TODAVÍA está reproduciéndose
    // (el botón puede aparecer hasta 5s antes de que termine), pausarlo acá
    // evita que la superficie nativa se desmonte mientras sigue decodificando
    // — eso es lo que probablemente causaba el flash de recuadro negro justo
    // antes de revelar el onboarding.
    player.pause();
    opacidadSalida.value = withTiming(0, { duration: SALIDA_MS, easing: Easing.inOut(Easing.cubic) });
    setTimeout(onTerminar, SALIDA_MS);
  }

  const estiloSalida = useAnimatedStyle(() => ({ opacity: opacidadSalida.value }));

  // El respaldo de RESPALDO_MS se arma UNA vez (no depende de `fase`), así
  // que si por algo `playToEnd` no llega a cancelarlo a tiempo (el evento no
  // es 100% confiable en todos los dispositivos), el propio timeout se
  // protege acá: solo puede salir mientras seguimos en 'reproduciendo'. Sin
  // este chequeo, ese respaldo podría "auto-aceptar" la pantalla de
  // bienvenida sin que la persona toque nada.
  const faseRef = useRef<Fase>('reproduciendo');
  useEffect(() => {
    faseRef.current = fase;
  }, [fase]);

  const player = useVideoPlayer(VIDEO_APERTURA, (player) => {
    player.muted = true;
    player.timeUpdateEventInterval = 0.15;
    player.play();
  });

  useEffect(() => {
    const respaldo = setTimeout(() => {
      if (faseRef.current === 'reproduciendo') salir();
    }, RESPALDO_MS);
    const suscripcionFin = player.addListener('playToEnd', () => {
      clearTimeout(respaldo);
      setFase('congelado');
    });
    return () => {
      suscripcionFin.remove();
      clearTimeout(respaldo);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [player]);

  // El texto se muestra para CUALQUIERA (con o sin sesión), sincronizado a
  // los últimos SEGUNDOS_ANTES_DEL_FIN_PARA_BIENVENIDA segundos del video —
  // independiente de `fase` y de la sesión.
  useEffect(() => {
    if (mostrarBienvenida) return;
    const suscripcion = player.addListener('timeUpdate', ({ currentTime }) => {
      const duracion = player.duration;
      if (duracion > 0 && currentTime >= Math.max(0, duracion - SEGUNDOS_ANTES_DEL_FIN_PARA_BIENVENIDA)) {
        setMostrarBienvenida(true);
      }
    });
    return () => suscripcion.remove();
  }, [mostrarBienvenida, player]);

  // Una vez que el video termina (fase 'congelado'): con sesión, sale sola
  // tras un respiro breve; sin sesión, no hace nada acá — el botón ya está
  // visible (mostrarBoton) y se espera el toque, sin timer de por medio.
  useEffect(() => {
    if (fase !== 'congelado') return;
    if (cargandoSesion || !usuario) return;
    const temporizador = setTimeout(salir, CONGELADO_MS);
    return () => clearTimeout(temporizador);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fase, cargandoSesion, usuario]);

  return (
    <Animated.View style={[s.raiz, estiloSalida]}>
    <LinearGradient colors={FONDO_MENTA} end={{ x: 0, y: 1 }} start={{ x: 0, y: 0 }} style={s.fondoInterior}>
      <View pointerEvents="none" style={s.aurora}>
        <AuroraBoreal tema="verde" />
      </View>
      <View pointerEvents="none" style={s.iconosFondoContenedor}>
        <GridIconosFondo />
      </View>

      <View style={[s.centro, mostrarBienvenida && s.centroAbajo]}>
        <View style={s.videoEnvoltorio}>
          <LinearGradient colors={COLORES_FONDO_VIDEO} end={{ x: 1, y: 1 }} start={{ x: 0, y: 0 }} style={s.videoFondo} />
          <VideoView
            contentFit="contain"
            fullscreenOptions={{ enable: false }}
            nativeControls={false}
            player={player}
            pointerEvents="none"
            style={s.video}
            surfaceType="textureView"
          />
        </View>

        {mostrarBienvenida && (
          // Sin animación de entrada por elemento a propósito — cada versión
          // con shared-values individuales terminaba con ALGÚN elemento
          // (distinto cada vez) quedándose pegado en invisible. En una
          // pantalla con tanta animación simultánea (video, aurora, grid), la
          // única garantía real de que el texto SIEMPRE se vea es no
          // depender de ninguna animación para su visibilidad: aparece de
          // golpe, a opacidad 1, apenas toca mostrarse.
          <View style={[s.contenidoBienvenida, { paddingBottom: insets.bottom + 32 }]}>
            <Texto style={[s.tituloBienvenida, { fontSize: tamanoBienvenidaTitulo, lineHeight: altoBienvenidaTitulo }]}>
              Bienvenido a
            </Texto>

            <View style={s.filaAccento}>
              <Image resizeMode="contain" source={ARBUSTO_ESMERALDA} style={[s.arbustoAccento, { height: altoAccento, width: altoAccento }]} />
              <MasterText
                coloresGradiente={DEGRADADO_VERDE_SUTIL}
                gradiente
                style={[s.accentoGradiente, { fontSize: tamanoAccento, lineHeight: altoAccento }]}
                variante="titulo"
              >
                Lestinaty
              </MasterText>
              <Image resizeMode="contain" source={ARBUSTO_ESMERALDA} style={[s.arbustoAccento, { height: altoAccento, width: altoAccento }]} />
            </View>

            <View style={s.separador} />

            <Texto style={s.subtituloBienvenida}>
              Convertí cada hábito en un árbol que crece con vos — pequeños pasos, todos los días, hasta ver tu propio jardín florecer.
            </Texto>

            {mostrarBoton && (
              <View style={s.botonEnvoltorio}>
                <MasterButton color={ESCALA_ESMERALDA.jade.l50} iconoDerecha={ArrowRight} onPress={salir} style={s.boton}>
                  Comenzar
                </MasterButton>
              </View>
            )}
          </View>
        )}
      </View>
    </LinearGradient>
    </Animated.View>
  );
}

const s = StyleSheet.create({
  raiz: { bottom: 0, left: 0, position: 'absolute', right: 0, top: 0, zIndex: 999 },
  fondoInterior: { flex: 1 },
  aurora: { bottom: 0, left: 0, position: 'absolute', right: 0, top: 0 },
  // Arranca en 26% de alto para no pisar la zona donde se concentra la
  // aurora — antes la grid se pintaba encima y le restaba protagonismo.
  iconosFondoContenedor: { bottom: 0, left: 0, opacity: 0.09, overflow: 'hidden', position: 'absolute', right: 0, top: '26%' },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  celdaGrid: { alignItems: 'center', justifyContent: 'center' },
  centro: { alignItems: 'center', flex: 1, gap: 4, justifyContent: 'center' },
  // Cuando aparece el bloque de bienvenida, el grupo entero (video congelado
  // + bienvenida) se ancla abajo en vez de quedar centrado — el video queda
  // visible arriba, no desaparece.
  centroAbajo: { justifyContent: 'flex-end' },
  videoEnvoltorio: { height: 220, width: 220 },
  videoFondo: { borderRadius: 28, bottom: 0, left: 0, position: 'absolute', right: 0, top: 0 },
  video: { borderRadius: 28, height: 220, overflow: 'hidden', width: 220 },
  contenidoBienvenida: { alignItems: 'center', gap: 4, marginTop: 24, paddingHorizontal: 28, width: '100%' },
  tituloBienvenida: { color: '#1A1335', fontFamily: 'MontserratAlternates-Bold', textAlign: 'center' },
  filaAccento: { alignItems: 'center', flexDirection: 'row', gap: 8, justifyContent: 'center' },
  arbustoAccento: {},
  accentoGradiente: { fontFamily: 'MontserratAlternates-Bold' },
  separador: { backgroundColor: conAlfa(ESCALA_ESMERALDA.jade.l50, 0.32), borderRadius: 1, height: 1.5, marginVertical: 12, width: 64 },
  subtituloBienvenida: {
    color: ESCALA_ESMERALDA.musgo.l51,
    fontFamily: 'Montserrat-Medium',
    fontSize: 15,
    lineHeight: 22,
    maxWidth: 330,
    textAlign: 'center',
  },
  botonEnvoltorio: { marginTop: 24, width: '100%' },
  boton: { height: 56, width: '100%' },
});
