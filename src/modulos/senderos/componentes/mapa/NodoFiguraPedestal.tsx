import { forwardRef, useEffect } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import Animated, { cancelAnimation, Easing, interpolate, runOnJS, useAnimatedStyle, useSharedValue, withDelay, withRepeat, withSpring, withTiming } from 'react-native-reanimated';
import { BlurMask, Canvas, Group, Oval } from '@shopify/react-native-skia';

import { Texto } from '../../../../diseno';
import { useEscala } from '../../../../diseno/tema/MasterColorContext';
import { hapticSeguro } from '../../../../nucleo/dispositivo/haptics';
import { ANGULO_REPOSO_MANDALA } from '../../../habitos/componentes/MandalaExtruido';
import { ParticulasMandala, RafagaParticulas } from '../../../habitos/componentes/ParticulasMandala';
import { SelloExtruido } from '../../../tareas/componentes/SelloExtruido';
import type { FiguraTareaNodo } from '../../../tareas/tareas.tipos';
import { PedestalBase, PedestalBotonSuperior } from './PedestalNodo';

/**
 * Fork de NodoMandalaPedestal.tsx para el sendero de días de Tareas (Fase 8):
 * mismo pedestal, pero el sólido es SelloExtruido (figura de espejo, aristas
 * rectas) en vez de MandalaExtruido (pétalos curvos rotados) — ver
 * figuraSello.ts para por qué dejaron de ser la misma geometría.
 */
const TAMANO_PEDESTAL = 84;
export const TAMANO_FIGURA_PEDESTAL = 64;
const CENTRO_TOPE_PEDESTAL = (119 / 303) * TAMANO_PEDESTAL;
const BASE_FIGURA = CENTRO_TOPE_PEDESTAL + 9;
const ARRIBA_FIGURA = BASE_FIGURA - TAMANO_FIGURA_PEDESTAL * 0.95;
const LADO_PARTICULAS = 84;
const PAUSA_GIRO_MS = 3000;
const DURACION_GIRO_MS = 1700;
const VUELTAS_EMERGENCIA = 2;
const DURACION_EMERGENCIA_MS = 1900;
const LADO_RAFAGA = 120;

type NodoFiguraPedestalProps = {
  color: string;
  /** La más reciente del sendero: da una vuelta lenta cada pocos segundos. */
  destacada: boolean;
  escalaEscena?: number;
  figura: FiguraTareaNodo;
  /** Mientras el ritual la trae en vuelo, el pedestal espera vacío y sin brillo. */
  oculta: boolean;
  onPress: () => void;
  particulas: NivelParticulas;
  /** La figura blanca del ritual acaba de fundirse aquí: la de nácar sube desde el pedestal. */
  emergiendo?: boolean;
  onEmergido?: () => void;
};

export type NivelParticulas = 'plenas' | 'suaves' | 'ninguna';

export const NodoFiguraPedestal = forwardRef<View, NodoFiguraPedestalProps>(function NodoFiguraPedestal(
  { color, destacada, emergiendo = false, escalaEscena = 1, figura, oculta, onEmergido, onPress, particulas },
  refAncla,
) {
  const { t } = useTranslation();
  const esc = useEscala();
  const creada = figura.estado === 'creada' && Boolean(figura.trazos && figura.trazos.length > 1);
  const pendiente = !creada;
  const giro = useSharedValue(ANGULO_REPOSO_MANDALA);
  const brillo = useSharedValue(0);
  const surgir = useSharedValue(1);
  const destelloSurgir = useSharedValue(0);
  const girando = destacada && creada && !oculta && !emergiendo;

  function iniciarVueltaLenta() {
    giro.value = ANGULO_REPOSO_MANDALA;
    giro.value = withRepeat(
      withDelay(PAUSA_GIRO_MS, withTiming(ANGULO_REPOSO_MANDALA + 360, { duration: DURACION_GIRO_MS, easing: Easing.inOut(Easing.cubic) })),
      -1,
      false,
    );
  }

  function volverAlReposo() {
    if (girando) iniciarVueltaLenta();
    else giro.value = ANGULO_REPOSO_MANDALA;
  }

  useEffect(() => {
    if (girando) iniciarVueltaLenta();
    else { cancelAnimation(giro); giro.value = ANGULO_REPOSO_MANDALA; }
    return () => cancelAnimation(giro);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [girando]);

  useEffect(() => {
    if (oculta) { surgir.value = 0; return; }
    if (!emergiendo || !creada) { surgir.value = 1; return; }
    hapticSeguro('impacto');
    surgir.value = 0;
    surgir.value = withSpring(1, { damping: 9, mass: 0.9, stiffness: 120 });
    destelloSurgir.value = 0;
    destelloSurgir.value = withTiming(1, { duration: 900, easing: Easing.out(Easing.cubic) });
    cancelAnimation(giro);
    giro.value = ANGULO_REPOSO_MANDALA - 360 * VUELTAS_EMERGENCIA;
    giro.value = withTiming(ANGULO_REPOSO_MANDALA, { duration: DURACION_EMERGENCIA_MS, easing: Easing.out(Easing.cubic) }, (terminado) => {
      if (terminado && onEmergido) runOnJS(onEmergido)();
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [oculta, emergiendo, creada]);

  useEffect(() => {
    if (!pendiente || oculta) { cancelAnimation(brillo); brillo.value = 0; return; }
    brillo.value = withRepeat(withTiming(1, { duration: 1400, easing: Easing.inOut(Easing.sin) }), -1, true);
    return () => cancelAnimation(brillo);
  }, [brillo, oculta, pendiente]);

  function girarPorToque() {
    const actual = giro.value;
    cancelAnimation(giro);
    const vueltas = Math.ceil((actual - ANGULO_REPOSO_MANDALA) / 360);
    const destino = ANGULO_REPOSO_MANDALA + 360 * (vueltas + 1);
    giro.value = withTiming(destino, { duration: 1100, easing: Easing.out(Easing.cubic) }, (terminado) => {
      if (terminado) runOnJS(volverAlReposo)();
    });
  }

  const estiloBrillo = useAnimatedStyle(() => ({ opacity: 0.35 + brillo.value * 0.5 }));
  const estiloSurgir = useAnimatedStyle(() => ({
    transform: [{ translateY: (1 - surgir.value) * 14 }, { scale: surgir.value }],
  }));
  const estiloDestelloSurgir = useAnimatedStyle(() => ({
    opacity: interpolate(destelloSurgir.value, [0, 0.12, 1], [0, 1, 0]),
    transform: [{ scaleX: 0.7 + destelloSurgir.value * 0.6 }],
  }));

  return (
    <View style={[styles.raiz, { transform: [{ scale: escalaEscena }] }]}>
      <Pressable
        accessibilityLabel={pendiente
          ? t('tareas.figura.pendienteAccesibilidad', { dia: figura.nodoDia })
          : t('tareas.figura.creadaAccesibilidad', { dia: figura.nodoDia })}
        accessibilityRole="button"
        hitSlop={{ top: 24 }}
        onPress={() => {
          hapticSeguro('seleccion');
          if (creada && !oculta && !emergiendo) girarPorToque();
          onPress();
        }}
        style={styles.boton}
      >
        <View style={styles.shell}>
          <PedestalBase color={color} tamano={TAMANO_PEDESTAL} />
          <PedestalBotonSuperior color={color} tamano={TAMANO_PEDESTAL} />
        </View>

        {pendiente && !oculta && (
          <Animated.View pointerEvents="none" style={[styles.brillo, estiloBrillo]}>
            <Canvas style={StyleSheet.absoluteFill}>
              <Group opacity={0.8}>
                <Oval color={color} height={20} width={52} x={10} y={12}>
                  <BlurMask blur={8} style="normal" />
                </Oval>
              </Group>
            </Canvas>
          </Animated.View>
        )}

        {creada && !oculta && (
          <Canvas pointerEvents="none" style={styles.sombra}>
            <Group opacity={0.35}>
              <Oval color={esc.hoja.l22} height={7} width={34} x={6} y={4}>
                <BlurMask blur={3} style="normal" />
              </Oval>
            </Group>
          </Canvas>
        )}

        {emergiendo && (
          <Animated.View pointerEvents="none" style={[styles.destelloSurgir, estiloDestelloSurgir]}>
            <Canvas style={StyleSheet.absoluteFill}>
              <Oval color={color} height={26} width={78} x={3} y={7}>
                <BlurMask blur={9} style="normal" />
              </Oval>
              <Oval color="#FFFFFF" height={12} width={44} x={20} y={14}>
                <BlurMask blur={5} style="normal" />
              </Oval>
            </Canvas>
          </Animated.View>
        )}

        <View collapsable={false} pointerEvents="none" ref={refAncla} style={styles.ancla}>
          {creada && !oculta && figura.trazos && (
            <Animated.View style={[styles.surgir, estiloSurgir]}>
              <SelloExtruido color={color} giro={giro} paqueteId={figura.paqueteId} tamano={TAMANO_FIGURA_PEDESTAL} trazos={figura.trazos} />
            </Animated.View>
          )}
        </View>

        {emergiendo && (
          <View pointerEvents="none" style={styles.rafaga}>
            <RafagaParticulas cantidad={16} progreso={destelloSurgir} tamano={LADO_RAFAGA} />
          </View>
        )}

        {creada && !oculta && particulas !== 'ninguna' && (
          <View pointerEvents="none" style={styles.particulas}>
            <ParticulasMandala
              cantidad={particulas === 'plenas' ? 8 : 4}
              escalaPunto={particulas === 'plenas' ? 1.1 : 0.9}
              intensidad={particulas === 'plenas' ? 1 : 0.45}
              tamano={LADO_PARTICULAS}
            />
          </View>
        )}
      </Pressable>

      {pendiente && !oculta && (
        <View pointerEvents="none" style={[styles.badge, { backgroundColor: color }]}>
          <Texto style={styles.badgeTexto}>{t('tareas.figura.badgeTerminar')}</Texto>
        </View>
      )}
    </View>
  );
});

const styles = StyleSheet.create({
  raiz: { alignItems: 'center', height: 96, width: 84 },
  boton: { alignItems: 'center', height: TAMANO_PEDESTAL, justifyContent: 'center', position: 'absolute', top: 6, width: TAMANO_PEDESTAL },
  shell: { height: TAMANO_PEDESTAL, width: TAMANO_PEDESTAL },
  brillo: { height: 44, left: 6, position: 'absolute', top: CENTRO_TOPE_PEDESTAL - 22, width: 72 },
  sombra: { height: 15, left: (TAMANO_PEDESTAL - 46) / 2, position: 'absolute', top: BASE_FIGURA - 7, width: 46 },
  ancla: {
    height: TAMANO_FIGURA_PEDESTAL,
    left: (TAMANO_PEDESTAL - TAMANO_FIGURA_PEDESTAL) / 2,
    position: 'absolute',
    top: ARRIBA_FIGURA,
    width: TAMANO_FIGURA_PEDESTAL,
  },
  surgir: { height: TAMANO_FIGURA_PEDESTAL, transformOrigin: 'bottom', width: TAMANO_FIGURA_PEDESTAL },
  destelloSurgir: { height: 40, left: 0, position: 'absolute', top: CENTRO_TOPE_PEDESTAL - 20, width: TAMANO_PEDESTAL },
  rafaga: { height: LADO_RAFAGA, left: (TAMANO_PEDESTAL - LADO_RAFAGA) / 2, position: 'absolute', top: CENTRO_TOPE_PEDESTAL - LADO_RAFAGA / 2, width: LADO_RAFAGA },
  particulas: {
    height: LADO_PARTICULAS,
    left: (TAMANO_PEDESTAL - LADO_PARTICULAS) / 2,
    position: 'absolute',
    top: ARRIBA_FIGURA + TAMANO_FIGURA_PEDESTAL / 2 - LADO_PARTICULAS * 0.6,
    width: LADO_PARTICULAS,
  },
  badge: {
    borderRadius: 8,
    bottom: -6,
    elevation: 4,
    paddingHorizontal: 7,
    paddingVertical: 2,
    position: 'absolute',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3,
  },
  badgeTexto: { color: '#FFFFFF', fontFamily: 'Montserrat-Bold', fontSize: 9, letterSpacing: 0.5 },
});
