import React, { useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, Image, Modal, Pressable, StyleSheet, View } from 'react-native';
import Animated, {
  FadeInDown,
  FadeOut,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useVideoPlayer, VideoView } from 'expo-video';
import { BlurMask, Canvas, Group, Path as PathSkia } from '@shopify/react-native-skia';
import { MasterButton, MasterGlass, Texto } from '../../../../diseno';
import { MasterChanger, colorMasterMasCercano } from '../../../../diseno/componentes/MasterChanger';
import { hapticSeguro } from '../../../../nucleo/dispositivo/haptics';
import { videoCofreParaPaquete } from '../../../habitos/cofreVideoPaquete';
import type { InfoCofre } from '../../datos/mapaEjercicio.mock';

// OJO: el nombre de archivo es engañoso — cofre.png es el cofre CERRADO y
// cofre-cerrado.png es el cofre ABIERTO (reclamado). Verificado visualmente.
const ASSET_CERRADO = require('../../../../../assets/ilustraciones/senderos/biomas/cofres/cofre.png');
const ASSET_ABIERTO = require('../../../../../assets/ilustraciones/senderos/biomas/cofres/cofre-cerrado.png');
const ASSET_GEMAS = require('../../../../../assets/icons/hoy/gemas.png');
const RESPALDO_VIDEO_MS = 4000;
// Hue real medido del verde de cada PNG — ver NodoCofreSendero.tsx para el
// porqué (auto-detectar mezcla el dorado del candado y contamina el hue).
const HUE_ORIGEN_CERRADO = 150;
const HUE_ORIGEN_ABIERTO = 155;

type Fase = 'inicial' | 'reclamando' | 'reproduciendo' | 'abierto';

type Props = {
  visible: boolean;
  cofre: InfoCofre | null;
  color: string;
  paqueteId: string;
  // 'manual' (default): se abre desde un tap en el mapa, con botón "¡Abrir
  // Cofre!" que dispara onReclamar. 'automatico': ya viene con las gemas
  // confirmadas (cofre final pagado por registrar_progreso_habito) y
  // reproduce el vídeo apenas aparece, sin botón de reclamo.
  modo?: 'manual' | 'automatico';
  gemasAcreditadas?: number;
  movimientoReducido?: boolean;
  onCerrar: () => void;
  onReclamar?: (cofre: InfoCofre) => Promise<{ gemas: number }>;
  onFinalizarAutomatico?: () => void;
};

export function ModalAperturaCofre({
  visible,
  cofre,
  color,
  paqueteId,
  modo = 'manual',
  gemasAcreditadas,
  movimientoReducido: movimientoReducidoProp,
  onCerrar,
  onReclamar,
  onFinalizarAutomatico,
}: Props) {
  const colorMaster = colorMasterMasCercano(color);
  const [fase, setFase] = useState<Fase>(modo === 'automatico' ? 'reproduciendo' : 'inicial');
  const [gemasGanadas, setGemasGanadas] = useState<number | null>(modo === 'automatico' ? gemasAcreditadas ?? null : null);
  const [movimientoReducidoDetectado, setMovimientoReducidoDetectado] = useState(false);
  const yaFinalizoRef = useRef(false);
  const respaldoRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const movimientoReducido = movimientoReducidoProp ?? movimientoReducidoDetectado;

  const player = useVideoPlayer(videoCofreParaPaquete(paqueteId), (instancia) => {
    instancia.loop = false;
    instancia.muted = true;
  });

  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled?.().then(setMovimientoReducidoDetectado);
  }, []);

  const elevacionGemas = useSharedValue(0);
  const escalaGemas = useSharedValue(0.2);
  const animGemas = useAnimatedStyle(() => ({
    opacity: withTiming(fase === 'abierto' ? 1 : 0, { duration: 250 }),
    transform: [{ translateY: elevacionGemas.value }, { scale: escalaGemas.value }],
  }));

  // Reinicia todo el estado interno cada vez que se abre para un cofre nuevo.
  useEffect(() => {
    if (!visible) return;
    yaFinalizoRef.current = false;
    if (modo === 'automatico') {
      setGemasGanadas(gemasAcreditadas ?? null);
      setFase(movimientoReducido ? 'abierto' : 'reproduciendo');
    } else {
      setGemasGanadas(null);
      setFase('inicial');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible, cofre?.nodoDia]);

  // Guarda contra que playToEnd, el error del reproductor y el respaldo de
  // 4s disparen la transición más de una vez para el mismo cofre.
  const finalizarUnaVez = (destino: Fase) => {
    if (respaldoRef.current) { clearTimeout(respaldoRef.current); respaldoRef.current = null; }
    if (yaFinalizoRef.current) return;
    yaFinalizoRef.current = true;
    setFase(destino);
  };

  // Reproduce el vídeo del paquete mientras `fase === 'reproduciendo'`; si
  // falla o no dispara playToEnd en RESPALDO_VIDEO_MS, igual se muestra el
  // premio (nunca se deja a la persona mirando una pantalla trabada).
  useEffect(() => {
    if (fase !== 'reproduciendo' || movimientoReducido) return;
    yaFinalizoRef.current = false;
    player.currentTime = 0;
    player.play();
    respaldoRef.current = setTimeout(() => finalizarUnaVez('abierto'), RESPALDO_VIDEO_MS);
    const suscripcionFin = player.addListener('playToEnd', () => { hapticSeguro('confirmacion'); finalizarUnaVez('abierto'); });
    const suscripcionEstado = player.addListener('statusChange', ({ status }) => {
      if (status === 'error') finalizarUnaVez('abierto');
    });
    return () => {
      suscripcionFin.remove();
      suscripcionEstado.remove();
      if (respaldoRef.current) { clearTimeout(respaldoRef.current); respaldoRef.current = null; }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fase, movimientoReducido, player]);

  // Un solo lugar dispara la erupción de gemas al entrar a 'abierto', sin
  // importar el camino: vídeo terminado, error/timeout, o reclamo directo
  // con reducción de movimiento activa.
  useEffect(() => {
    if (fase !== 'abierto') return;
    elevacionGemas.value = withSpring(-70, { damping: 9, stiffness: 160 });
    escalaGemas.value = withSpring(1.2, { damping: 8, stiffness: 200 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fase]);

  const resetear = () => {
    if (modo === 'automatico') { onFinalizarAutomatico?.(); return; }
    onCerrar();
  };

  const ejecutarReclamo = async () => {
    if (!cofre || !onReclamar || fase !== 'inicial') return;
    setFase('reclamando');
    hapticSeguro('accion');
    try {
      const resultado = await onReclamar(cofre);
      setGemasGanadas(resultado.gemas);
      setFase(movimientoReducido ? 'abierto' : 'reproduciendo');
    } catch {
      hapticSeguro('accion');
      setFase('inicial');
    }
  };

  if (!visible || (modo === 'manual' && !cofre)) return null;

  const esFinal = modo === 'automatico' || cofre?.tipo === 'final';
  const titulo = esFinal ? '¡Cofre Final de Nivel!' : '¡Cofre de Constancia!';
  const subtitulo = esFinal
    ? 'Has completado todos los días del nivel. Reclama tu recompensa.'
    : '¡Tu disciplina tiene recompensa! Abre el cofre para descubrir tus gemas.';
  const abierto = fase === 'abierto';

  return (
    <Modal animationType="fade" onRequestClose={resetear} transparent visible={visible}>
      <View style={styles.fondo}>
        <Pressable onPress={abierto ? resetear : undefined} style={StyleSheet.absoluteFill} />

        <Animated.View entering={FadeInDown.duration(280)} exiting={FadeOut.duration(200)} style={styles.tarjeta}>
          <MasterGlass blur style={styles.glass}>
            <Canvas pointerEvents="none" style={styles.lienzoBrillo}>
              <Group opacity={0.35}>
                <PathSkia color={color} path="M10 90 C 70 20, 150 20, 210 90 S 150 160, 10 90" strokeWidth={20} style="stroke">
                  <BlurMask blur={18} style="normal" />
                </PathSkia>
              </Group>
            </Canvas>

            <Texto style={[styles.titulo, { color }]}>{titulo}</Texto>
            <Texto style={styles.subtitulo}>{subtitulo}</Texto>

            <View style={styles.escenaCofre}>
              {fase === 'reproduciendo' ? (
                <VideoView
                  contentFit="contain"
                  fullscreenOptions={{ enable: false }}
                  nativeControls={false}
                  player={player}
                  pointerEvents="none"
                  style={styles.video}
                  surfaceType="textureView"
                />
              ) : (
                <View style={styles.cofreWrapper}>
                  <MasterChanger
                    alto={140}
                    ancho={140}
                    colorDestino={colorMaster}
                    fit="contain"
                    fuente={abierto ? ASSET_ABIERTO : ASSET_CERRADO}
                    hueOrigen={abierto ? HUE_ORIGEN_ABIERTO : HUE_ORIGEN_CERRADO}
                    soloPixelesVerdes
                  />
                </View>
              )}

              {abierto && (
                <Animated.View pointerEvents="none" style={[styles.gemasErupcion, animGemas]}>
                  <Image source={ASSET_GEMAS} style={styles.gemaGrande} />
                  <Texto style={styles.gemasTexto}>+{gemasGanadas ?? cofre?.gemasMin ?? 0} Gemas</Texto>
                </Animated.View>
              )}
            </View>

            <View style={styles.acciones}>
              {modo === 'manual' && fase === 'inicial' && (
                <MasterButton color={color} onPress={ejecutarReclamo} style={{ width: '100%' }}>
                  ¡Abrir Cofre!
                </MasterButton>
              )}
              {fase === 'reclamando' && (
                <MasterButton color={color} disabled style={{ width: '100%' }}>
                  Abriendo...
                </MasterButton>
              )}
              {abierto && (
                <MasterButton color={color} onPress={resetear} style={{ width: '100%' }}>
                  Continuar
                </MasterButton>
              )}
            </View>
          </MasterGlass>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  fondo: {
    alignItems: 'center',
    backgroundColor: 'rgba(10, 8, 20, 0.65)',
    flex: 1,
    justifyContent: 'center',
    padding: 24,
  },
  tarjeta: {
    maxWidth: 360,
    width: '100%',
  },
  glass: {
    alignItems: 'center',
    borderRadius: 28,
    overflow: 'hidden',
    padding: 24,
  },
  lienzoBrillo: {
    height: 180,
    position: 'absolute',
    top: 70,
    width: 220,
  },
  titulo: {
    fontFamily: 'MontserratAlternates-Bold',
    fontSize: 20,
    textAlign: 'center',
  },
  subtitulo: {
    color: '#6F687F',
    fontFamily: 'Montserrat-Medium',
    fontSize: 13,
    lineHeight: 18,
    marginTop: 8,
    textAlign: 'center',
  },
  escenaCofre: {
    alignItems: 'center',
    height: 170,
    justifyContent: 'center',
    marginVertical: 18,
    position: 'relative',
    width: '100%',
  },
  cofreWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  video: {
    height: 160,
    width: 160,
  },
  gemasErupcion: {
    alignItems: 'center',
    gap: 6,
    position: 'absolute',
    top: 20,
    zIndex: 10,
  },
  gemaGrande: {
    height: 48,
    resizeMode: 'contain',
    width: 48,
  },
  gemasTexto: {
    color: '#6D28D9',
    fontFamily: 'MontserratAlternates-Bold',
    fontSize: 18,
    textShadowColor: 'rgba(255, 255, 255, 0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  acciones: {
    marginTop: 8,
    width: '100%',
  },
});
