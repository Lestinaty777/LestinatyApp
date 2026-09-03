import { useEffect, useRef, useState } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import Svg, { Defs, G, LinearGradient, Path, Stop } from 'react-native-svg';

import { crearTrazoMandalaAby, trazosMandalaAby } from './mandalaAby.config';
import { crearPulsoFinalMandalaAby } from './animacionMandalaAby.config';

const TrazoAnimado = Animated.createAnimatedComponent(Path);
const GrupoAnimado = Animated.createAnimatedComponent(G);
const longitudTrazo = 500;

export function MandalaAby({ color = '#98A3B1' }: { color?: string }) {
  const trazos = useRef(trazosMandalaAby.map(() => new Animated.Value(0))).current;
  const opacidad = useRef(new Animated.Value(0)).current;
  const escala = useRef(new Animated.Value(1)).current;
  const rotacion = useRef(new Animated.Value(0)).current;
  const [ciclo, setCiclo] = useState(0);
  const trazoPetalo = crearTrazoMandalaAby(ciclo);
  const pulso = crearPulsoFinalMandalaAby(ciclo);

  useEffect(() => {
    trazos.forEach((trazo) => trazo.setValue(0));
    opacidad.setValue(0);
    escala.setValue(1);
    rotacion.setValue(0);
    const animacion = Animated.sequence([
      Animated.parallel([
        Animated.timing(opacidad, { duration: pulso.duracionEntrada, toValue: 1, useNativeDriver: false }),
        Animated.stagger(pulso.retrasoTrazo, trazos.map((trazo, indice) => Animated.timing(trazo, { duration: pulso.duracionTrazo + indice * 55, toValue: 1, useNativeDriver: false }))),
      ]),
      Animated.delay(pulso.esperaFinal),
      Animated.parallel([
        Animated.timing(escala, { duration: pulso.duracionExpansion, toValue: pulso.escalaMaxima, useNativeDriver: true }),
        Animated.timing(rotacion, { duration: pulso.duracionExpansion, toValue: 0.64, useNativeDriver: true }),
      ]),
      Animated.delay(160),
      Animated.parallel([
        Animated.timing(opacidad, { duration: pulso.duracionSalida, toValue: 0, useNativeDriver: false }),
        Animated.timing(escala, { duration: pulso.duracionSalida, toValue: pulso.escalaFinal, useNativeDriver: true }),
        Animated.timing(rotacion, { duration: pulso.duracionSalida, toValue: 1, useNativeDriver: true }),
      ]),
      Animated.delay(300),
    ]);
    animacion.start(({ finished }) => {
      if (finished) setCiclo((actual) => actual + 1);
    });
    return () => animacion.stop();
  }, [ciclo, escala, opacidad, rotacion, trazos]);

  return <View accessibilityElementsHidden pointerEvents="none" style={styles.raiz}>
    <Animated.View style={[styles.lienzo, { transform: [{ rotate: rotacion.interpolate({ inputRange: [0, 1], outputRange: ['0deg', `${pulso.rotacionFinal}deg`] }) }, { scale: escala }] }]}>
      <Svg height={152} viewBox="0 0 160 160" width={152}>
      <Defs>
        <LinearGradient id="mandalaAby" x1="18" x2="142" y1="18" y2="142">
          <Stop offset="0" stopColor={color} stopOpacity="0.46" />
          <Stop offset="0.54" stopColor={color} stopOpacity="0.98" />
          <Stop offset="1" stopColor="#FFFFFF" stopOpacity="0.9" />
        </LinearGradient>
      </Defs>
      <GrupoAnimado opacity={opacidad}>
        {trazosMandalaAby.map((angulo, indice) => <G key={angulo} origin="80, 80" rotation={angulo}>
          <TrazoAnimado d={trazoPetalo} fill="none" stroke="url(#mandalaAby)" strokeDasharray={longitudTrazo} strokeDashoffset={trazos[indice].interpolate({ inputRange: [0, 1], outputRange: [longitudTrazo, 0] })} strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.9} />
        </G>)}
      </GrupoAnimado>
      </Svg>
    </Animated.View>
  </View>;
}

const styles = StyleSheet.create({ lienzo: { height: 152, width: 152 }, raiz: { alignItems: 'center', height: 140, justifyContent: 'center', marginBottom: 6 } });
