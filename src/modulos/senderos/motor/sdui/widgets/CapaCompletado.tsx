import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { Check } from 'lucide-react-native';
import { Texto } from '../../../../../diseno';

function conAlpha(color: string, alpha: string) { return `${color}${alpha}`; }

function Burbuja({ delay, color, left, maxVal }: { delay: number, color: string, left: string, maxVal: number }) {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(anim, {
      toValue: 1,
      duration: 1200,
      delay,
      useNativeDriver: true
    }).start();
  }, [anim, delay]);

  const translateY = anim.interpolate({ inputRange: [0, 1], outputRange: [20, -maxVal] });
  const opacity = anim.interpolate({ inputRange: [0, 0.2, 0.8, 1], outputRange: [0, 1, 1, 0] });
  const scale = anim.interpolate({ inputRange: [0, 1], outputRange: [0.2, 1.2] });

  return (
    <Animated.View style={{
      position: 'absolute',
      left: left as any,
      bottom: '30%',
      width: 12, height: 12,
      borderRadius: 6,
      backgroundColor: 'rgba(0,0,0,0.4)',
      transform: [{ translateY }, { scale }],
      opacity
    }} />
  );
}

export function CapaCompletado({ color, activo }: { color: string, activo: boolean }) {
  const progreso = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (activo) {
      Animated.sequence([
        Animated.delay(3000), // Pausa de 3 segundos para admirar el widget
        Animated.timing(progreso, {
          toValue: 1,
          duration: 600,
          useNativeDriver: false
        }),
        Animated.spring(progreso, {
          toValue: 2,
          useNativeDriver: false,
          friction: 5,
          tension: 40
        })
      ]).start();
    } else {
      progreso.setValue(0);
    }
  }, [activo, progreso]);

  if (!activo) return null;

  const liquidoTop = progreso.interpolate({
    inputRange: [0, 1, 2],
    outputRange: ['100%', '0%', '0%'],
    extrapolate: 'clamp'
  });

  const contenidoOpacity = progreso.interpolate({
    inputRange: [0, 0.8, 1.2, 2],
    outputRange: [0, 0, 1, 1],
    extrapolate: 'clamp'
  });

  const checkScale = progreso.interpolate({
    inputRange: [0, 1, 2],
    outputRange: [0, 0.5, 1],
    extrapolate: 'clamp'
  });

  return (
    <View style={styles.capaAbsoluta} pointerEvents="none">
      <Animated.View style={[styles.liquido, { top: liquidoTop as any, backgroundColor: conAlpha(color, 'E6') }]}>
        <Burbuja delay={3500} color={color} left="20%" maxVal={60} />
        <Burbuja delay={3650} color={color} left="50%" maxVal={80} />
        <Burbuja delay={3550} color={color} left="80%" maxVal={70} />
        <Burbuja delay={3750} color={color} left="35%" maxVal={90} />
        <Burbuja delay={3850} color={color} left="65%" maxVal={50} />

        <Animated.View style={[styles.centro, { opacity: contenidoOpacity }]}>
          <Animated.View style={{ transform: [{ scale: checkScale }] }}>
            <Check color="#FFF" size={48} strokeWidth={3} />
          </Animated.View>
          <Texto style={styles.textoFelicidades}>Completado</Texto>
        </Animated.View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  capaAbsoluta: {
    ...StyleSheet.absoluteFill as any,
    borderRadius: 24,
    overflow: 'hidden',
    zIndex: 10
  },
  liquido: {
    position: 'absolute',
    left: 0, right: 0, bottom: 0,
    justifyContent: 'center',
    alignItems: 'center'
  },
  centro: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -20
  },
  textoFelicidades: {
    fontFamily: 'MontserratAlternates-Bold',
    fontSize: 16,
    color: '#FFF',
    marginTop: 8,
    textTransform: 'uppercase',
    letterSpacing: 1
  }
});
