import { useEffect, useRef } from 'react';
import type { Icon } from 'phosphor-react-native';
import { CalendarStar, CompassRose, Mountains, Storefront, Target } from 'phosphor-react-native';
import { Animated, Pressable, StyleSheet, View } from 'react-native';

import { biomas, colores } from '../../diseno';
import { hapticSeguro } from '../dispositivo/haptics';

type NombreIconoTab = 'hoy' | 'metas' | 'ruta' | 'senderos' | 'tienda';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);
const colorActivo = biomas.inicio.Paleta.primaryDark;
const colorActivoGlass = 'rgba(82, 99, 58, 0.82)';
const colorInactivo = '#76736D';
const radioGlassTab = 12;
const tamanoIconoTab = 31;

function obtenerIcono(nombre: NombreIconoTab): Icon {
  if (nombre === 'hoy') return CalendarStar;
  if (nombre === 'senderos') return Mountains;
  if (nombre === 'tienda') return Storefront;
  if (nombre === 'metas') return Target;

  return CompassRose;
}

export function IconoTab({ focused, nombre }: { focused: boolean; nombre: NombreIconoTab }) {
  const progreso = useRef(new Animated.Value(focused ? 1 : 0)).current;

  useEffect(() => {
    Animated.spring(progreso, {
      friction: 5,
      tension: 160,
      toValue: focused ? 1 : 0,
      useNativeDriver: true,
    }).start();
  }, [focused, progreso]);

  const escala = progreso.interpolate({
    inputRange: [0, 1],
    outputRange: [0.94, 1.08],
  });
  const desplazamiento = progreso.interpolate({
    inputRange: [0, 1],
    outputRange: [1, -1],
  });
  const opacidad = progreso.interpolate({
    inputRange: [0, 1],
    outputRange: [0.62, 1],
  });
  const opacidadGlass = progreso.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });
  const escalaGlass = progreso.interpolate({
    inputRange: [0, 1],
    outputRange: [0.78, 1],
  });
  const Icono = obtenerIcono(nombre);

  return (
    <View style={styles.iconoRaiz}>
      <Animated.View
        pointerEvents="none"
        style={[styles.placaGlass, { opacity: opacidadGlass, transform: [{ scale: escalaGlass }] }]}
      >
        <View style={styles.brilloSuperior} />
        <View style={styles.brilloLateral} />
        <View style={styles.bordeGlass} />
      </Animated.View>

      <Animated.View
        style={[
          focused && styles.iconoAnimadoActivo,
          { opacity: opacidad, transform: [{ translateY: desplazamiento }, { scale: escala }] },
        ]}
      >
        <Icono
          color={focused ? colorActivoGlass : colorInactivo}
          duotoneColor={focused ? colores.superficie : colorInactivo}
          duotoneOpacity={focused ? 0.68 : 0.24}
          size={tamanoIconoTab}
          weight={focused ? 'duotone' : 'fill'}
        />
      </Animated.View>
      <Animated.View style={[styles.indicador, { opacity: progreso, transform: [{ scaleX: progreso }] }]} />
    </View>
  );
}

export function BotonTab({ accessibilityState, onPress, ref: _ref, ...props }: any) {
  const escala = useRef(new Animated.Value(1)).current;

  function presionar() {
    Animated.sequence([
      Animated.timing(escala, {
        duration: 80,
        toValue: 0.92,
        useNativeDriver: true,
      }),
      Animated.spring(escala, {
        friction: 4,
        tension: 180,
        toValue: 1,
        useNativeDriver: true,
      }),
    ]).start();

    hapticSeguro('seleccion');
    onPress?.();
  }

  return (
    <AnimatedPressable
      {...props}
      accessibilityState={accessibilityState}
      onPress={presionar}
      style={[styles.boton, { transform: [{ scale: escala }] }]}
    />
  );
}

export const iconosTabs: Record<string, NombreIconoTab> = {
  direccion: 'ruta',
  inicio: 'hoy',
  metas: 'metas',
  senderos: 'senderos',
  tienda: 'tienda',
};

const styles = StyleSheet.create({
  boton: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    minHeight: 62,
  },
  iconoRaiz: {
    alignItems: 'center',
    height: 48,
    justifyContent: 'center',
    width: 54,
  },
  bordeGlass: {
    borderColor: 'rgba(255, 255, 255, 0.56)',
    borderRadius: radioGlassTab,
    borderTopWidth: 0.8,
    borderWidth: 0.4,
    bottom: 0,
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
  },
  brilloLateral: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 999,
    bottom: 9,
    left: 8,
    position: 'absolute',
    top: 9,
    width: 4,
  },
  brilloSuperior: {
    backgroundColor: 'rgba(255, 255, 255, 0.42)',
    borderRadius: 999,
    height: 8,
    left: 9,
    position: 'absolute',
    right: 9,
    top: 5,
  },
  iconoAnimadoActivo: {
    shadowColor: colores.superficie,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.85,
    shadowRadius: 6,
  },
  indicador: {
    backgroundColor: 'rgba(82, 99, 58, 0.72)',
    borderRadius: 999,
    bottom: 2,
    height: 3,
    position: 'absolute',
    shadowColor: colores.superficie,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.55,
    shadowRadius: 4,
    width: 16,
  },
  placaGlass: {
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
    borderRadius: radioGlassTab,
    bottom: 0,
    height: 46,
    overflow: 'hidden',
    position: 'absolute',
    shadowColor: colorActivo,
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.16,
    shadowRadius: 9,
    width: 50,
  },
});
