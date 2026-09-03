import { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';
import Svg, { Defs, LinearGradient, Path, Stop } from 'react-native-svg';

export function AuroraBiomaAby({ acento, visible }: { acento: string; visible: boolean }) {
  const desplazamiento = useRef(new Animated.Value(0)).current;
  const opacidad = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!visible) {
      desplazamiento.stopAnimation();
      opacidad.setValue(0);
      return;
    }
    opacidad.setValue(0);
    const aparicion = Animated.timing(opacidad, { duration: 700, toValue: 1, useNativeDriver: true });
    const movimiento = Animated.loop(Animated.sequence([
      Animated.timing(desplazamiento, { duration: 3800, easing: Easing.inOut(Easing.sin), toValue: 1, useNativeDriver: true }),
      Animated.timing(desplazamiento, { duration: 3800, easing: Easing.inOut(Easing.sin), toValue: 0, useNativeDriver: true }),
    ]));
    aparicion.start();
    movimiento.start();
    return () => { aparicion.stop(); movimiento.stop(); };
  }, [desplazamiento, opacidad, visible]);

  return <Animated.View pointerEvents="none" style={[styles.raiz, { opacity: opacidad, transform: [{ translateX: desplazamiento.interpolate({ inputRange: [0, 1], outputRange: [-12, 12] }) }] }]}>
    <Svg height="270" viewBox="0 0 400 270" width="100%">
      <Defs><LinearGradient id="auroraAby" x1="0" x2="1" y1="0" y2="0"><Stop offset="0" stopColor={acento} stopOpacity="0" /><Stop offset="0.38" stopColor={acento} stopOpacity="0.52" /><Stop offset="0.66" stopColor="#FFFFFF" stopOpacity="0.64" /><Stop offset="1" stopColor={acento} stopOpacity="0" /></LinearGradient></Defs>
      <Path d="M-30 70 C52 12 105 148 186 70 S315 3 430 58" fill="none" stroke="url(#auroraAby)" strokeLinecap="round" strokeWidth="22" />
      <Path d="M-26 132 C65 82 118 208 202 133 S332 57 426 111" fill="none" stroke="url(#auroraAby)" strokeLinecap="round" strokeOpacity="0.82" strokeWidth="13" />
      <Path d="M-28 28 C63 80 125 -15 209 42 S333 114 428 24" fill="none" stroke="url(#auroraAby)" strokeLinecap="round" strokeOpacity="0.66" strokeWidth="9" />
    </Svg>
  </Animated.View>;
}

const styles = StyleSheet.create({ raiz: { left: -12, position: 'absolute', right: -12, top: 0 } });
