import type { LucideIcon } from 'lucide-react-native';
import React, { useEffect, useRef } from 'react';
import { Animated, Easing, Pressable, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import type { EstadoNodoMapa } from '../../datos/mapaEjercicio.mock';
import { hapticSeguro } from '../../../../nucleo/dispositivo/haptics';
import { PedestalBase, PedestalBaseBloqueada, PedestalBotonBloqueado, PedestalBotonSuperior } from './PedestalNodo';

// Ícono bloqueado: antes un verde grisáceo fijo ('#5C8A57') sin importar el
// hábito — ahora una versión oscurecida/apagada del color real, mismo criterio
// que el resto del pedestal bloqueado (PedestalNodo.tsx ya lo hace por paleta).
function oscurecer(color: string, factor = 0.65) {
  const hex = color.replace('#', '');
  const canal = (inicio: number) => Math.round(parseInt(hex.slice(inicio, inicio + 2), 16) * factor).toString(16).padStart(2, '0');
  return `#${canal(0)}${canal(2)}${canal(4)}`;
}

type NodoSenderoProps = {
  Icono: LucideIcon;
  asentado: boolean;
  color: string;
  estado: EstadoNodoMapa;
  onCompletar?: () => void;
  onPress: () => void;
  escalaEscena?: number;
  seleccionado: boolean;
};

const TAMANO_PEDESTAL = 84;
// La elipse superior (clara, ahora más CHICA que la oscura — ver
// PedestalNodo.tsx) está centrada 17.5 unidades más arriba que la media
// (oscura) en el lienzo original de 302x303. Este desplazamiento las centra
// exactamente una encima de la otra al presionar — como es más chica, queda
// un borde parejo de la oscura visible alrededor, no tapada por completo.
const DESPLAZAMIENTO_PRESS = 21.5 * (TAMANO_PEDESTAL / 307);

export function NodoSendero({ Icono, asentado, color, estado, onCompletar, onPress, escalaEscena = 1, seleccionado }: NodoSenderoProps) {
  const { t } = useTranslation();
  const halo = useRef(new Animated.Value(0)).current;
  const asentamiento = useRef(new Animated.Value(asentado ? 1 : 0)).current;
  const inspeccion = useRef(new Animated.Value(0)).current;
  const pulsoInspeccion = useRef(new Animated.Value(0)).current;
  // 'esperando' reusa el pedestal/oscurecido de bloqueado — la distinción de
  // copy ("vuelve mañana") vive en el tooltip (TooltipNodoSeleccionado).
  const bloqueado = estado === 'bloqueado' || estado === 'esperando';

  useEffect(() => {
    Animated.spring(halo, {
      damping: 18,
      mass: 0.6,
      stiffness: 240,
      toValue: seleccionado ? 1 : 0,
      useNativeDriver: true,
    }).start();
  }, [halo, seleccionado]);

  useEffect(() => () => pulsoInspeccion.stopAnimation(), [pulsoInspeccion]);

  useEffect(() => {
    Animated.timing(asentamiento, {
      duration: asentado ? 140 : 220,
      easing: Easing.out(Easing.cubic),
      toValue: asentado ? 1 : 0,
      useNativeDriver: true,
    }).start();
  }, [asentado, asentamiento]);

  const profundidad = asentamiento;
  // Solo scaleX (no scale parejo): encoge nada más los costados, un pelito —
  // deja intacto el alto (ry/translateY) que ya se calibró para que la
  // elipse clara caiga bien sobre la oscura al presionar.
  const escalaX = profundidad.interpolate({ inputRange: [0, 1], outputRange: [1, 0.93] });
  // Oscurece la elipse oscura (el "socket") ~20% mientras está presionada —
  // overlay negro semitransparente, ver PedestalBase en PedestalNodo.tsx.
  const oscurecimientoMedio = profundidad.interpolate({ inputRange: [0, 1], outputRange: [0, 0.2] });
  const descensoBase = profundidad.interpolate({ inputRange: [0, 1], outputRange: [0, DESPLAZAMIENTO_PRESS] });
  const descensoInspeccion = inspeccion.interpolate({ inputRange: [0, 1], outputRange: [0, 4] });
  const descenso = Animated.add(descensoBase, descensoInspeccion);

  return (
    <View style={[styles.raiz, { transform: [{ scale: escalaEscena }] }]}>
      <Pressable
        accessibilityLabel={bloqueado ? t('senderos.nodeAccessibility.blocked') : t('senderos.nodeAccessibility.open')}
        accessibilityRole="button"
        onPress={() => {
          hapticSeguro('seleccion');
          onPress();
        }}
        onLongPress={() => {
          if (estado === 'activo' && onCompletar) {
            hapticSeguro('seleccion');
            onCompletar();
            return;
          }
          if (!bloqueado) {
            Animated.timing(inspeccion, { duration: 140, toValue: 1, useNativeDriver: true }).start();
            pulsoInspeccion.stopAnimation();
            pulsoInspeccion.setValue(0);
            Animated.loop(Animated.sequence([
              Animated.timing(pulsoInspeccion, { duration: 520, toValue: 1, useNativeDriver: true }),
              Animated.timing(pulsoInspeccion, { duration: 520, toValue: 0, useNativeDriver: true }),
            ])).start();
          }
          hapticSeguro('seleccion');
        }}
        onPressOut={() => {
          pulsoInspeccion.stopAnimation();
          Animated.timing(inspeccion, { duration: 160, toValue: 0, useNativeDriver: true }).start();
        }}
        style={styles.botonNodo}
      >
        {/* Base y botón vienen del diseño de Figma del usuario, separados a
            propósito: la base pálida se queda quieta, y solo el botón de
            colores saturados (+ el ícono real, dinámico según el paso,
            montado encima) recibe el efecto press (translateY/scale). */}
        <View style={styles.shell}>
          {bloqueado ? <PedestalBaseBloqueada color={color} tamano={TAMANO_PEDESTAL} /> : <PedestalBase color={color} oscurecimiento={oscurecimientoMedio} tamano={TAMANO_PEDESTAL} />}
          <Animated.View style={[styles.capaBoton, { transform: [{ translateY: descenso }, { scaleX: escalaX }] }]}>
            {bloqueado ? <PedestalBotonBloqueado color={color} tamano={TAMANO_PEDESTAL} /> : <PedestalBotonSuperior color={color} tamano={TAMANO_PEDESTAL} />}
            <View pointerEvents="none" style={styles.iconoContenedor}>
              <Icono color={bloqueado ? oscurecer(color) : '#FFFFFF'} size={27} strokeWidth={2.7} />
            </View>
          </Animated.View>
        </View>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  raiz: {
    alignItems: 'center',
    height: 96,
    width: 84,
  },
  botonNodo: {
    alignItems: 'center',
    height: TAMANO_PEDESTAL,
    justifyContent: 'center',
    position: 'absolute',
    top: 6,
    width: TAMANO_PEDESTAL,
  },
  halo: {
    borderRadius: 46,
    height: 92,
    position: 'absolute',
    top: 6,
    width: 92,
  },
  shell: {
    height: TAMANO_PEDESTAL,
    width: TAMANO_PEDESTAL,
  },
  capaBoton: {
    height: TAMANO_PEDESTAL,
    left: 0,
    position: 'absolute',
    top: 0,
    width: TAMANO_PEDESTAL,
  },
  iconoContenedor: {
    alignItems: 'center',
    height: 27,
    justifyContent: 'center',
    left: 28.5,
    position: 'absolute',
    top: 19,
    width: 27,
  },
});
