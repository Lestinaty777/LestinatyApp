import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import Animated, { useAnimatedProps, useSharedValue, withSpring } from 'react-native-reanimated';

const CirculoAnimado = Animated.createAnimatedComponent(Circle);

type AnilloProgresoProps = {
  children?: React.ReactNode;
  color: string;
  fondo?: string;
  grosor?: number;
  porcentaje: number;
  tamano?: number;
};

// Anillo de progreso circular animado (spring). Pensado para "hoy" de un
// hábito (valorHoy/meta), pero es un primitivo genérico del sistema de diseño.
export function AnilloProgreso({ children, color, fondo, grosor = 10, porcentaje, tamano = 112 }: AnilloProgresoProps) {
  const radio = (tamano - grosor) / 2;
  const circunferencia = 2 * Math.PI * radio;
  const avance = useSharedValue(0);

  useEffect(() => {
    avance.value = withSpring(Math.min(100, Math.max(0, porcentaje)), { damping: 16, mass: 0.7, stiffness: 110 });
  }, [avance, porcentaje]);

  const propsAnimadas = useAnimatedProps(() => ({
    strokeDashoffset: circunferencia * (1 - avance.value / 100),
  }));

  return (
    <View style={[styles.raiz, { height: tamano, width: tamano }]}>
      <Svg height={tamano} width={tamano}>
        <Circle cx={tamano / 2} cy={tamano / 2} fill="none" r={radio} stroke={fondo ?? `${color}26`} strokeWidth={grosor} />
        <CirculoAnimado
          animatedProps={propsAnimadas}
          cx={tamano / 2}
          cy={tamano / 2}
          fill="none"
          origin={`${tamano / 2}, ${tamano / 2}`}
          r={radio}
          rotation={-90}
          stroke={color}
          strokeDasharray={`${circunferencia} ${circunferencia}`}
          strokeLinecap="round"
          strokeWidth={grosor}
        />
      </Svg>
      {children ? <View pointerEvents="none" style={styles.centro}>{children}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  centro: { alignItems: 'center', justifyContent: 'center', position: 'absolute' },
  raiz: { alignItems: 'center', justifyContent: 'center' },
});
