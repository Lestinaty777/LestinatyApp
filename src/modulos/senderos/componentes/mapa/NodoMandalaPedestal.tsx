import { forwardRef, useEffect } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import Animated, { cancelAnimation, Easing, runOnJS, useAnimatedStyle, useSharedValue, withDelay, withRepeat, withTiming } from 'react-native-reanimated';
import { BlurMask, Canvas, Group, Oval } from '@shopify/react-native-skia';

import { Texto } from '../../../../diseno';
import { useEscala } from '../../../../diseno/tema/MasterColorContext';
import { hapticSeguro } from '../../../../nucleo/dispositivo/haptics';
import { ANGULO_REPOSO_MANDALA, MandalaExtruido } from '../../../habitos/componentes/MandalaExtruido';
import { ParticulasMandala } from '../../../habitos/componentes/ParticulasMandala';
import type { InfoMandalaNodo } from '../../../habitos/mandalaNodo.tipos';
import { PedestalBase, PedestalBotonSuperior } from './PedestalNodo';

const TAMANO_PEDESTAL = 84;
export const TAMANO_MANDALA_PEDESTAL = 64;
// Centro de la elipse superior del pedestal (cy=119 en el lienzo 302x303 de
// PedestalNodo.tsx). La mandala se para un poco por debajo, "plantada".
const CENTRO_TOPE_PEDESTAL = (119 / 303) * TAMANO_PEDESTAL;
const BASE_MANDALA = CENTRO_TOPE_PEDESTAL + 9;
const ARRIBA_MANDALA = BASE_MANDALA - TAMANO_MANDALA_PEDESTAL * 0.95;
const LADO_PARTICULAS = 84;
const PAUSA_GIRO_MS = 3000;
const DURACION_GIRO_MS = 1700;

type NodoMandalaPedestalProps = {
  color: string;
  /** La más reciente del sendero: da una vuelta lenta cada pocos segundos. */
  destacada: boolean;
  escalaEscena?: number;
  mandala: InfoMandalaNodo;
  /** Mientras el ritual la trae en vuelo, el pedestal espera vacío y sin brillo. */
  oculta: boolean;
  onPress: () => void;
  /** Plenas en la última mandala, suaves en las demás cerca de la pantalla, ninguna lejos. */
  particulas: NivelParticulas;
};

export type NivelParticulas = 'plenas' | 'suaves' | 'ninguna';

// Nodo de día terminado con mandala: el mismo pedestal de los nodos del
// sendero y, encima, la mandala de pie con volumen. `pendiente` (el ritual
// no se terminó) deja el pedestal vacío con un brillo que invita a trazarla.
// El ref apunta a la caja exacta de la mandala: CompositorOverlay la mide
// para aterrizar encima sin salto.
export const NodoMandalaPedestal = forwardRef<View, NodoMandalaPedestalProps>(function NodoMandalaPedestal(
  { color, destacada, escalaEscena = 1, mandala, oculta, onPress, particulas },
  refAncla,
) {
  const { t } = useTranslation();
  const esc = useEscala();
  const creada = mandala.estado === 'creada' && Boolean(mandala.trazos && mandala.trazos.length > 1);
  const pendiente = !creada;
  const giro = useSharedValue(ANGULO_REPOSO_MANDALA);
  const brillo = useSharedValue(0);
  const girando = destacada && creada && !oculta;

  function iniciarVueltaLenta() {
    giro.value = ANGULO_REPOSO_MANDALA;
    // withRepeat sin reversa reinicia desde el reposo en cada vuelta; como
    // reposo+360 es la misma pose, el reinicio no se ve.
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
    if (!pendiente || oculta) { cancelAnimation(brillo); brillo.value = 0; return; }
    brillo.value = withRepeat(withTiming(1, { duration: 1400, easing: Easing.inOut(Easing.sin) }), -1, true);
    return () => cancelAnimation(brillo);
  }, [brillo, oculta, pendiente]);

  function girarPorToque() {
    const actual = giro.value;
    cancelAnimation(giro);
    // Una vuelta completa con impulso que frena, terminando siempre en la
    // pose de reposo — como una peonza empujada con el dedo.
    const vueltas = Math.ceil((actual - ANGULO_REPOSO_MANDALA) / 360);
    const destino = ANGULO_REPOSO_MANDALA + 360 * (vueltas + 1);
    giro.value = withTiming(destino, { duration: 1100, easing: Easing.out(Easing.cubic) }, (terminado) => {
      if (terminado) runOnJS(volverAlReposo)();
    });
  }

  const estiloBrillo = useAnimatedStyle(() => ({ opacity: 0.35 + brillo.value * 0.5 }));

  return (
    <View style={[styles.raiz, { transform: [{ scale: escalaEscena }] }]}>
      <Pressable
        accessibilityLabel={pendiente
          ? t('habitos.mandala.pendienteAccesibilidad', { dia: mandala.nodoDia })
          : t('habitos.mandala.creadaAccesibilidad', { dia: mandala.nodoDia })}
        accessibilityRole="button"
        hitSlop={{ top: 24 }}
        onPress={() => {
          hapticSeguro('seleccion');
          if (creada && !oculta) girarPorToque();
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

        <View collapsable={false} pointerEvents="none" ref={refAncla} style={styles.ancla}>
          {creada && !oculta && mandala.trazos && (
            <MandalaExtruido color={color} giro={giro} paqueteId={mandala.paqueteId} tamano={TAMANO_MANDALA_PEDESTAL} trazos={mandala.trazos} />
          )}
        </View>

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
          <Texto style={styles.badgeTexto}>{t('habitos.mandala.badgeTerminar')}</Texto>
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
  sombra: { height: 15, left: (TAMANO_PEDESTAL - 46) / 2, position: 'absolute', top: BASE_MANDALA - 7, width: 46 },
  ancla: {
    height: TAMANO_MANDALA_PEDESTAL,
    left: (TAMANO_PEDESTAL - TAMANO_MANDALA_PEDESTAL) / 2,
    position: 'absolute',
    top: ARRIBA_MANDALA,
    width: TAMANO_MANDALA_PEDESTAL,
  },
  particulas: {
    height: LADO_PARTICULAS,
    left: (TAMANO_PEDESTAL - LADO_PARTICULAS) / 2,
    position: 'absolute',
    top: ARRIBA_MANDALA + TAMANO_MANDALA_PEDESTAL / 2 - LADO_PARTICULAS * 0.6,
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
