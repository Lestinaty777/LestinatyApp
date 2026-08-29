import { useEffect, useRef } from 'react';
import type { Icon } from 'phosphor-react-native';
import { CalendarStar, CompassRose, Crosshair, Mountains, Storefront, Target } from 'phosphor-react-native';
import { Animated, Pressable, StyleSheet, View } from 'react-native';

import { biomas, colores } from '../../diseno';
import { hapticSeguro } from '../dispositivo/haptics';
import { usarAccionBarraSenderos } from '../../modulos/senderos/estado/accionBarraSenderos.estado';

type NombreIconoTab = 'hoy' | 'metas' | 'ruta' | 'senderos' | 'tienda';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);
const colorActivo = biomas.inicio.Paleta.primaryDark;
const colorActivoGlass = 'rgba(82, 99, 58, 0.82)';
const colorInactivo = '#76736D';
const radioGlassTab = 10;
const tamanoIconoTab = 26;

function obtenerIcono(nombre: NombreIconoTab): Icon {
  if (nombre === 'hoy') return CalendarStar;
  if (nombre === 'senderos') return Mountains;
  if (nombre === 'tienda') return Storefront;
  if (nombre === 'metas') return Target;

  return CompassRose;
}

export function IconoTab({ accionContextual, focused, nombre }: { accionContextual?: { color: string } | null; focused: boolean; nombre: NombreIconoTab }) {
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
  const mostrarAccionContextual = nombre === 'tienda' && accionContextual;

  return (
    <View style={styles.iconoRaiz}>
      {mostrarAccionContextual ? (
        <View pointerEvents="none" style={styles.accionContextualRaiz}>
          <View style={styles.accionContextualPuente} />
          <View style={styles.accionContextualBurbuja}>
            <View style={[styles.accionContextualBoton, { backgroundColor: accionContextual.color }]}>
              <Crosshair color="#FFFFFF" size={20} weight="bold" />
            </View>
          </View>
        </View>
      ) : null}
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

export function BotonTab({ accessibilityState, accionContextual, onPress, ref: _ref, ...props }: any) {
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

    if (accionContextual) {
      hapticSeguro('accion');
      accionContextual.ejecutar();
      return;
    }

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

export function IconoTiendaContextual({ focused }: { focused: boolean }) {
  const accion = usarAccionBarraSenderos((estado) => estado.accion);
  return <IconoTab accionContextual={accion} focused={focused} nombre="tienda" />;
}

export function BotonTiendaContextual(props: any) {
  const accion = usarAccionBarraSenderos((estado) => estado.accion);
  return <BotonTab {...props} accionContextual={accion} />;
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
    minHeight: 52,
  },
  iconoRaiz: {
    alignItems: 'center',
    height: 40,
    justifyContent: 'center',
    width: 44,
  },
  accionContextualRaiz: {
    alignItems: 'center',
    bottom: 21,
    height: 56,
    justifyContent: 'flex-end',
    position: 'absolute',
    width: 60,
    zIndex: 4,
  },
  accionContextualPuente: {
    backgroundColor: 'rgba(255, 255, 255, 0.90)',
    bottom: 0,
    height: 20,
    position: 'absolute',
    width: 42,
  },
  accionContextualBurbuja: {
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.94)',
    borderColor: 'rgba(255, 255, 255, 0.98)',
    borderRadius: 28,
    borderWidth: 0.8,
    height: 56,
    justifyContent: 'center',
    shadowColor: '#564A3C',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.14,
    shadowRadius: 9,
    width: 56,
  },
  accionContextualBoton: {
    alignItems: 'center',
    borderRadius: 20,
    height: 40,
    justifyContent: 'center',
    width: 40,
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
    bottom: 7,
    left: 6,
    position: 'absolute',
    top: 7,
    width: 3,
  },
  brilloSuperior: {
    backgroundColor: 'rgba(255, 255, 255, 0.42)',
    borderRadius: 999,
    height: 6,
    left: 7,
    position: 'absolute',
    right: 7,
    top: 4,
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
    bottom: 1,
    height: 2,
    position: 'absolute',
    shadowColor: colores.superficie,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.55,
    shadowRadius: 4,
    width: 13,
  },
  placaGlass: {
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
    borderRadius: radioGlassTab,
    bottom: 0,
    height: 38,
    overflow: 'hidden',
    position: 'absolute',
    shadowColor: colorActivo,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.16,
    shadowRadius: 7,
    width: 40,
  },
});
