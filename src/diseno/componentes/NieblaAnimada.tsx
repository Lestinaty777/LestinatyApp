import { PropsWithChildren, useEffect, useRef } from 'react';
import { Animated, StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { BlurView } from 'expo-blur';

type NieblaAnimadaProps = PropsWithChildren<{
  style?: StyleProp<ViewStyle>;
}>;

type NieblaCapaProps = {
  delay?: number;
  duracion: number;
  inicioX: number;
  inicioY: number;
  movimientoX: number;
  movimientoY: number;
  opacidad?: number;
  size: number;
  style: ViewStyle;
};

function NieblaCapa({
  delay = 0,
  duracion,
  inicioX,
  inicioY,
  movimientoX,
  movimientoY,
  opacidad = 1,
  size,
  style,
}: NieblaCapaProps) {
  const progreso = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animacion = Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.timing(progreso, {
          duration: duracion,
          toValue: 1,
          useNativeDriver: true,
        }),
        Animated.timing(progreso, {
          duration: duracion,
          toValue: 0,
          useNativeDriver: true,
        }),
      ]),
    );

    animacion.start();

    return () => animacion.stop();
  }, [delay, duracion, progreso]);

  const translateX = progreso.interpolate({
    inputRange: [0, 1],
    outputRange: [inicioX, inicioX + movimientoX],
  });
  const translateY = progreso.interpolate({
    inputRange: [0, 1],
    outputRange: [inicioY, inicioY + movimientoY],
  });
  const scale = progreso.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [1, 1.08, 1],
  });
  const opacity = progreso.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [opacidad, opacidad * 0.9, opacidad],
  });

  return (
    <Animated.View
      style={[
        styles.capa,
        style,
        {
          height: size,
          opacity,
          transform: [{ translateX }, { translateY }, { scale }],
          width: size,
        },
      ]}
    >
      <BlurView intensity={88} tint="light" style={styles.blur} />
      <View style={styles.nucleo} />
    </Animated.View>
  );
}

export function NieblaAnimada({ children, style }: NieblaAnimadaProps) {
  return (
    <View pointerEvents="none" style={[styles.raiz, style]}>
      <NieblaCapa
        duracion={7600}
        inicioX={-140}
        inicioY={8}
        movimientoX={110}
        movimientoY={-18}
        opacidad={0.72}
        size={220}
        style={styles.capaGrande}
      />
      <NieblaCapa
        delay={400}
        duracion={9400}
        inicioX={54}
        inicioY={-20}
        movimientoX={-96}
        movimientoY={16}
        opacidad={0.66}
        size={260}
        style={styles.capaMuyGrande}
      />
      <NieblaCapa
        delay={850}
        duracion={8200}
        inicioX={210}
        inicioY={4}
        movimientoX={72}
        movimientoY={18}
        opacidad={0.62}
        size={190}
        style={styles.capaMedia}
      />
      <NieblaCapa
        delay={250}
        duracion={7000}
        inicioX={-20}
        inicioY={88}
        movimientoX={86}
        movimientoY={-10}
        opacidad={0.6}
        size={240}
        style={styles.capaInferior}
      />
      <NieblaCapa
        delay={700}
        duracion={7800}
        inicioX={180}
        inicioY={92}
        movimientoX={-70}
        movimientoY={-12}
        opacidad={0.58}
        size={210}
        style={styles.capaInferiorMedia}
      />
      <View pointerEvents="none" style={styles.velo} />
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  raiz: {
    overflow: 'hidden',
  },
  capa: {
    alignItems: 'center',
    borderRadius: 999,
    justifyContent: 'center',
    position: 'absolute',
  },
  blur: {
    borderRadius: 999,
    ...StyleSheet.absoluteFill,
  },
  nucleo: {
    backgroundColor: 'rgba(255, 255, 255, 0.26)',
    borderRadius: 999,
    height: '58%',
    opacity: 0.65,
    position: 'absolute',
    width: '58%',
  },
  capaGrande: {
    left: 0,
    top: 6,
  },
  capaMuyGrande: {
    left: 18,
    top: 0,
  },
  capaMedia: {
    right: 0,
    top: 8,
  },
  capaInferior: {
    left: 8,
    top: 82,
  },
  capaInferiorMedia: {
    right: 10,
    top: 88,
  },
  velo: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    bottom: 0,
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
  },
});
