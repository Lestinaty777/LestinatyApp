import type { LucideIcon } from 'lucide-react-native';
import React, { useEffect, useRef } from 'react';
import { Animated, Pressable, StyleSheet, View } from 'react-native';

import type { EstadoNodoMapa } from '../../datos/mapaEjercicio.mock';
import { hapticSeguro } from '../../../../nucleo/dispositivo/haptics';

type NodoSenderoProps = {
  Icono: LucideIcon;
  color: string;
  estado: EstadoNodoMapa;
  onPress: () => void;
  seleccionado: boolean;
};

export function NodoSendero({ Icono, color, estado, onPress, seleccionado }: NodoSenderoProps) {
  const presion = useRef(new Animated.Value(0)).current;
  const halo = useRef(new Animated.Value(0)).current;
  const bloqueado = estado === 'bloqueado';
  const completado = estado === 'completado';

  useEffect(() => {
    Animated.spring(halo, {
      damping: 18,
      mass: 0.6,
      stiffness: 240,
      toValue: seleccionado ? 1 : 0,
      useNativeDriver: true,
    }).start();
  }, [halo, seleccionado]);

  const escala = presion.interpolate({ inputRange: [0, 1], outputRange: [1, 0.94] });
  const escalaHalo = halo.interpolate({ inputRange: [0, 1], outputRange: [0.82, 1.22] });
  const opacidadHalo = halo.interpolate({ inputRange: [0, 1], outputRange: [0, 0.28] });
  const fondo = bloqueado ? '#D8D3CD' : completado ? '#8FE49A' : color;
  const borde = bloqueado ? '#C3BDB6' : completado ? '#56BD67' : '#FFFFFF';

  return (
    <View style={styles.raiz}>
      <Animated.View
        pointerEvents="none"
        style={[styles.halo, { backgroundColor: color, opacity: opacidadHalo, transform: [{ scale: escalaHalo }] }]}
      />
      <Pressable
        accessibilityLabel={bloqueado ? 'Paso bloqueado' : 'Abrir paso'}
        accessibilityRole="button"
        disabled={bloqueado}
        onPress={() => {
          hapticSeguro('seleccion');
          onPress();
        }}
        onPressIn={() => Animated.spring(presion, { damping: 14, stiffness: 310, toValue: 1, useNativeDriver: true }).start()}
        onPressOut={() => Animated.spring(presion, { damping: 16, stiffness: 280, toValue: 0, useNativeDriver: true }).start()}
      >
        <Animated.View style={[styles.nodo, { backgroundColor: fondo, borderColor: borde, transform: [{ scale: escala }] }]}>
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
    height: 72,
    justifyContent: 'center',
    width: 72,
  },
  halo: {
    borderRadius: 36,
    height: 72,
    position: 'absolute',
    width: 72,
  },
  nodo: {
    alignItems: 'center',
    borderRadius: 25,
    borderWidth: 3,
    elevation: 5,
    height: 58,
    justifyContent: 'center',
    shadowColor: '#24321F',
    shadowOffset: { height: 5, width: 0 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    width: 58,
  },
  bisel: {
    borderColor: 'rgba(255,255,255,0.52)',
    borderRadius: 19,
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
