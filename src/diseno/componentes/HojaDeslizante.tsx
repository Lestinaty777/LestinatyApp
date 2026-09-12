import React, { useEffect } from 'react';
import { Dimensions, Pressable, StyleSheet, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { runOnJS, useAnimatedStyle, useSharedValue, withSpring, withTiming } from 'react-native-reanimated';

const { height: ALTO_PANTALLA } = Dimensions.get('window');
const RESORTE_ABIERTO = { damping: 20, mass: 0.85, stiffness: 190 };
const UMBRAL_CIERRE_PX = 120;
const UMBRAL_CIERRE_VELOCIDAD = 800;

type HojaDeslizanteProps = {
  alturaMaxima?: number;
  children: React.ReactNode;
  onCerrar: () => void;
};

// Hoja que se desliza desde abajo sobre la pantalla actual (sin reemplazarla
// del todo): fondo con backdrop, tarjeta con esquinas redondeadas y gesto de
// arrastre para cerrar. La pantalla que la invoca sigue montada detrás.
export function HojaDeslizante({ alturaMaxima = 0.92, children, onCerrar }: HojaDeslizanteProps) {
  const traslado = useSharedValue(ALTO_PANTALLA);
  const opacidadFondo = useSharedValue(0);

  useEffect(() => {
    traslado.value = withSpring(0, RESORTE_ABIERTO);
    opacidadFondo.value = withTiming(1, { duration: 220 });
  }, [opacidadFondo, traslado]);

  function cerrar() {
    traslado.value = withTiming(ALTO_PANTALLA, { duration: 220 });
    opacidadFondo.value = withTiming(0, { duration: 200 }, (terminado) => {
      if (terminado) runOnJS(onCerrar)();
    });
  }

  const gesto = Gesture.Pan()
    .onUpdate((evento) => {
      if (evento.translationY > 0) traslado.value = evento.translationY;
    })
    .onEnd((evento) => {
      if (evento.translationY > UMBRAL_CIERRE_PX || evento.velocityY > UMBRAL_CIERRE_VELOCIDAD) {
        runOnJS(cerrar)();
      } else {
        traslado.value = withSpring(0, RESORTE_ABIERTO);
      }
    });

  const estiloHoja = useAnimatedStyle(() => ({ transform: [{ translateY: traslado.value }] }));
  const estiloFondo = useAnimatedStyle(() => ({ opacity: opacidadFondo.value }));

  return (
    <View style={StyleSheet.absoluteFill}>
      <Animated.View style={[StyleSheet.absoluteFill, styles.fondo, estiloFondo]}>
        <Pressable accessibilityLabel="Cerrar" onPress={cerrar} style={StyleSheet.absoluteFill} />
      </Animated.View>
      <GestureDetector gesture={gesto}>
        <Animated.View style={[styles.hoja, { maxHeight: ALTO_PANTALLA * alturaMaxima }, estiloHoja]}>
          <View style={styles.asa} />
          {children}
        </Animated.View>
      </GestureDetector>
    </View>
  );
}

const styles = StyleSheet.create({
  asa: {
    alignSelf: 'center',
    backgroundColor: 'rgba(0,0,0,0.16)',
    borderRadius: 3,
    height: 5,
    marginBottom: 4,
    marginTop: 10,
    width: 40,
  },
  fondo: {
    backgroundColor: 'rgba(15, 10, 30, 0.45)',
  },
  hoja: {
    backgroundColor: '#F3EEFA',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    bottom: 0,
    left: 0,
    overflow: 'hidden',
    position: 'absolute',
    right: 0,
  },
});
