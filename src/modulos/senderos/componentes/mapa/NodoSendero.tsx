import type { LucideIcon } from 'lucide-react-native';
import React, { useEffect, useRef } from 'react';
import { Animated, Easing, Pressable, StyleSheet, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import type { EstadoNodoMapa } from '../../datos/mapaEjercicio.mock';
import { hapticSeguro } from '../../../../nucleo/dispositivo/haptics';

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

function oscurecer(color: string, factor = 0.58) {
  const hex = color.replace('#', '');
  const canal = (inicio: number) => Math.round(parseInt(hex.slice(inicio, inicio + 2), 16) * factor).toString(16).padStart(2, '0');
  return `#${canal(0)}${canal(2)}${canal(4)}`;
}

export function NodoSendero({ Icono, asentado, color, estado, onCompletar, onPress, escalaEscena = 1, seleccionado }: NodoSenderoProps) {
  const halo = useRef(new Animated.Value(0)).current;
  const asentamiento = useRef(new Animated.Value(asentado ? 1 : 0)).current;
  const inspeccion = useRef(new Animated.Value(0)).current;
  const pulsoInspeccion = useRef(new Animated.Value(0)).current;
  const bloqueado = estado === 'bloqueado';

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
      duration: asentado ? 260 : 430,
      easing: Easing.out(Easing.cubic),
      toValue: asentado ? 1 : 0,
      useNativeDriver: true,
    }).start();
  }, [asentado, asentamiento]);

  const profundidad = asentamiento;
  const escala = profundidad.interpolate({ inputRange: [0, 1], outputRange: [1, 0.985] });
  const descensoBase = profundidad.interpolate({ inputRange: [0, 1], outputRange: [0, 8] });
  const descensoInspeccion = inspeccion.interpolate({ inputRange: [0, 1], outputRange: [0, 4] });
  const descenso = Animated.add(descensoBase, descensoInspeccion);
  const intensidadHalo = Animated.add(halo, pulsoInspeccion);
  const escalaHalo = intensidadHalo.interpolate({ inputRange: [0, 2], outputRange: [0.82, 1.3] });
  const opacidadHalo = intensidadHalo.interpolate({ inputRange: [0, 2], outputRange: [0, 0.34] });
  const opacidadExtrusion = profundidad.interpolate({ inputRange: [0, 1], outputRange: [1, 0] });
  const fondo = bloqueado ? '#D8D3CD' : color;
  const base = bloqueado ? '#AAA49D' : oscurecer(fondo);

  return (
    <View style={[styles.raiz, { transform: [{ scale: escalaEscena }] }]}>
      <Animated.View
        pointerEvents="none"
        style={[styles.halo, { backgroundColor: color, opacity: opacidadHalo, transform: [{ scale: escalaHalo }] }]}
      />
      <View pointerEvents="none" style={styles.pedestal}>
        <View style={styles.pedestalCara} />
        <View style={styles.pedestalLateral} />
      </View>
      <Animated.View pointerEvents="none" style={[styles.sombraAmbiental, { opacity: opacidadExtrusion }]} />
      <Animated.View pointerEvents="none" style={[styles.extrusion, { opacity: opacidadExtrusion }]}>
        <Svg height={66} width={58}>
          <Path d="M 0 29 A 29 29 0 0 0 58 29 L 58 37 A 29 29 0 0 1 0 37 Z" fill={base} />
          <Path d="M 4 31 A 25 25 0 0 0 54 31 L 54 35" fill="none" stroke="rgba(255,255,255,0.16)" strokeLinecap="round" strokeWidth={1.2} />
        </Svg>
      </Animated.View>
      <Pressable
        accessibilityLabel={bloqueado ? 'Inspeccionar paso bloqueado' : 'Abrir paso'}
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
          Animated.timing(inspeccion, { duration: 140, toValue: 1, useNativeDriver: true }).start();
          pulsoInspeccion.stopAnimation();
          pulsoInspeccion.setValue(0);
          Animated.loop(Animated.sequence([
            Animated.timing(pulsoInspeccion, { duration: 520, toValue: 1, useNativeDriver: true }),
            Animated.timing(pulsoInspeccion, { duration: 520, toValue: 0, useNativeDriver: true }),
          ])).start();
          hapticSeguro('seleccion');
        }}
        onPressOut={() => {
          pulsoInspeccion.stopAnimation();
          Animated.timing(inspeccion, { duration: 160, toValue: 0, useNativeDriver: true }).start();
        }}
        style={styles.botonNodo}
      >
        <Animated.View style={[styles.nodo, asentado && styles.nodoAsentado, { backgroundColor: fondo, transform: [{ translateY: descenso }, { scale: escala }] }]}>
          <View style={[styles.bisel, bloqueado && styles.biselBloqueado]} />
          <Icono color={bloqueado ? '#928C86' : '#FFFFFF'} size={27} strokeWidth={2.7} />
        </Animated.View>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  raiz: {
    alignItems: 'center',
    height: 90,
    width: 72,
  },
  botonNodo: {
    alignItems: 'center',
    height: 58,
    justifyContent: 'center',
    left: 7,
    position: 'absolute',
    top: 0,
    width: 58,
  },
  halo: {
    borderRadius: 36,
    height: 72,
    position: 'absolute',
    width: 72,
  },
  nodo: {
    alignItems: 'center',
    borderRadius: 29,
    height: 58,
    justifyContent: 'center',
    width: 58,
  },
  nodoAsentado: {
    borderColor: 'rgba(42, 53, 39, 0.28)',
    borderWidth: 2,
  },
  extrusion: {
    left: 7,
    position: 'absolute',
    top: 0,
    width: 58,
  },
  sombraAmbiental: {
    backgroundColor: 'rgba(53, 43, 35, 0.16)',
    borderRadius: 999,
    height: 5,
    left: 10,
    position: 'absolute',
    top: 80,
    width: 52,
  },
  pedestal: {
    alignItems: 'center',
    left: 2,
    position: 'absolute',
    top: 4,
    width: 68,
  },
  pedestalCara: {
    backgroundColor: '#F2F0EC',
    borderColor: 'rgba(255,255,255,0.92)',
    borderRadius: 34,
    borderWidth: 1,
    height: 68,
    width: 68,
    zIndex: 2,
  },
  pedestalLateral: {
    backgroundColor: '#BDB6AE',
    borderRadius: 34,
    height: 68,
    left: 0,
    marginTop: 0,
    position: 'absolute',
    top: 8,
    width: 68,
  },
  bisel: {
    borderColor: 'rgba(255,255,255,0.52)',
    borderRadius: 22,
    borderTopWidth: 1.5,
    height: 43,
    left: 5,
    position: 'absolute',
    top: 5,
    width: 43,
  },
  biselBloqueado: {
    borderColor: 'rgba(255,255,255,0.34)',
  },
});
