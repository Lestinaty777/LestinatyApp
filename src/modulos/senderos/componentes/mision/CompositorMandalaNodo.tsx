import { useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import Svg, { Path } from 'react-native-svg';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { runOnJS } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Texto, useTintarHex } from '../../../../diseno';
import { useEscala } from '../../../../diseno/tema/MasterColorContext';
import { hapticSeguro } from '../../../../nucleo/dispositivo/haptics';
import { construirCaminosMandala } from '../../../habitos/mandalaGeometria';
import { guardarMandalaRegistro } from '../../../habitos/mandalaNodo.servicio';
import type { TrazoMandala } from '../../../habitos/mandalaNodo.tipos';

const LADO = 320;
const RADIO_MAXIMO = 150;
const TOPE_LONGITUD = 1140; // 380 + 200%, mismo tope validado en el prototipo
const MIN_PUNTOS = 5;
const MIN_LONGITUD = 26;

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
  if (d <= RADIO_MAXIMO) return p;
  const k = RADIO_MAXIMO / d;
  return { x: p.x * k, y: p.y * k };
}

// Un solo gesto continuo, simetría radial de 7 en vivo — puerto directo del
// prototipo interactivo ya validado (mismo tope de longitud, misma cinta
// con casquetes redondos vía mandalaGeometria.ts). Al soltar, si el trazo
// es válido, queda fija: llama a guardar_mandala_registro y pasa a
// MasterNodeFinalization.
export function CompositorMandalaNodo() {
  const params = useLocalSearchParams<{ registroId: string; color?: string; paqueteId?: string; nodoDia?: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const esm = useTintarHex();
  const esc = useEscala();
  const color = params.color || esm('#7FE3B0');

  const [puntos, setPuntos] = useState<TrazoMandala[]>([]);
  const [capeado, setCapeado] = useState(false);
  const [fijada, setFijada] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const trazandoRef = useRef(false);

  function iniciarTrazo(x: number, y: number) {
    if (fijada) return;
    trazandoRef.current = true;
    setCapeado(false);
    setPuntos([limitarAlAnillo({ x, y })]);
  }

  function agregarPunto(x: number, y: number) {
    if (!trazandoRef.current || fijada) return;
    setPuntos((actuales) => {
      if (actuales.length === 0) return actuales;
      const capeadoYa = longitudTrazo(actuales) >= TOPE_LONGITUD;
      if (capeadoYa) return actuales;
      const ultimo = actuales[actuales.length - 1];
      const siguiente = limitarAlAnillo({ x, y });
      const paso = distancia(ultimo, siguiente);
      const largoActual = longitudTrazo(actuales);
      if (largoActual + paso >= TOPE_LONGITUD) {
        const restante = Math.max(0, TOPE_LONGITUD - largoActual);
        const k = paso > 0 ? restante / paso : 0;
        const punto = { x: ultimo.x + (siguiente.x - ultimo.x) * k, y: ultimo.y + (siguiente.y - ultimo.y) * k };
        setCapeado(true);
        return [...actuales, punto];
      }
      return [...actuales, siguiente];
    });
  }

  function finalizarTrazo() {
    if (!trazandoRef.current || fijada) return;
    trazandoRef.current = false;
    setPuntos((actuales) => {
      if (actuales.length < MIN_PUNTOS || longitudTrazo(actuales) < MIN_LONGITUD) {
        // Trazo demasiado corto — se descarta, no queda una mandala a medias.
        return [];
      }
      hapticSeguro('confirmacion');
      fijarMandala(actuales);
      return actuales;
    });
  }

  async function fijarMandala(trazoFinal: TrazoMandala[]) {
    setFijada(true);
    setGuardando(true);
    try {
      await guardarMandalaRegistro(params.registroId, trazoFinal);
      setTimeout(() => {
        router.replace({
          pathname: '/senderos/master-node-finalization',
          params: {
            color,
            nodoDia: params.nodoDia ?? '1',
            paqueteId: params.paqueteId ?? '',
            trazos: JSON.stringify(trazoFinal),
          },
        });
      }, 550);
    } catch {
      // No se pudo guardar: se deja fija visualmente (evita perder el
      // trazo dibujado) y se reintenta al reabrir el nodo pendiente.
      setGuardando(false);
    }
  }

  const gesto = Gesture.Pan()
    .onBegin((evento) => {
      const cx = LADO / 2;
      const cy = LADO / 2;
      runOnJS(iniciarTrazo)(evento.x - cx, evento.y - cy);
    })
    .onUpdate((evento) => {
      const cx = LADO / 2;
      const cy = LADO / 2;
      runOnJS(agregarPunto)(evento.x - cx, evento.y - cy);
    })
    .onEnd(() => {
      runOnJS(finalizarTrazo)();
    });

  const anchoBase = LADO * 0.06;
  const caminos = construirCaminosMandala(puntos.length > 1 ? puntos : [{ x: 0, y: 0 }, { x: 0.01, y: 0 }], anchoBase);
  const viewBoxLado = RADIO_MAXIMO * 2 + 20;

  const estado = fijada
    ? (guardando ? t('habitos.mandala.compositor.guardando') : t('habitos.mandala.finalizacion.nodoCultivado'))
    : capeado
      ? t('habitos.mandala.compositor.listoParaSoltar')
      : puntos.length > 0
        ? t('habitos.mandala.compositor.formando')
        : t('habitos.mandala.compositor.instruccion');

  return (
    <View style={[styles.raiz, { backgroundColor: esc.hoja.l97, paddingBottom: insets.bottom + 24, paddingTop: insets.top + 24 }]}>
      <Texto style={[styles.titulo, { color: esc.hoja.l22 }]}>{t('habitos.mandala.compositor.titulo')}</Texto>
      <View style={styles.centro}>
        <GestureDetector gesture={gesto}>
          <View style={[styles.superficie, { height: LADO, width: LADO }]}>
            <View style={[styles.guia, { borderColor: color }]} />
            <Svg height={LADO} pointerEvents="none" style={StyleSheet.absoluteFill}
              viewBox={`${-viewBoxLado / 2} ${-viewBoxLado / 2} ${viewBoxLado} ${viewBoxLado}`} width={LADO}>
              {caminos.map((d, indice) => (d ? <Path d={d} fill={color} fillOpacity={0.94} key={indice} /> : null))}
            </Svg>
          </View>
        </GestureDetector>
      </View>
      <Texto style={[styles.estado, { color: esc.musgo.l42 }]}>{estado}</Texto>
    </View>
  );
}

const styles = StyleSheet.create({
  raiz: { alignItems: 'center', flex: 1, justifyContent: 'space-between', paddingHorizontal: 24 },
  titulo: { fontFamily: 'MontserratAlternates-Bold', fontSize: 18, textAlign: 'center' },
  centro: { alignItems: 'center', flex: 1, justifyContent: 'center' },
  superficie: { alignItems: 'center', justifyContent: 'center' },
  guia: { borderRadius: LADO / 2, borderWidth: 1.5, height: LADO * 0.94, opacity: 0.4, position: 'absolute', width: LADO * 0.94 },
  estado: { fontFamily: 'Montserrat-Medium', fontSize: 13, marginBottom: 12, textAlign: 'center' },
});
