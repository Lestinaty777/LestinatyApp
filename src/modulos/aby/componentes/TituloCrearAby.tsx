import { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View } from 'react-native';

import { Texto } from '../../../diseno';
import { MandalaAby } from './MandalaAby';

const lineas = [
  ['APRUEBA', 'TUS'],
  ['EXAMENES', 'CON'],
  ['UN', 'PLAN', 'HECHO', 'PARA', 'TI.'],
];
const palabras = lineas.flat();

export function TituloCrearAby({ acento, subtitulo }: { acento?: string; subtitulo?: string }) {
  const entradas = useRef(palabras.map(() => new Animated.Value(0))).current;
  const entradaSubtitulo = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animacion = Animated.stagger(105, entradas.map((entrada) => Animated.timing(entrada, { duration: 380, toValue: 1, useNativeDriver: true })));
    animacion.start();
    return () => animacion.stop();
  }, [entradas]);

  useEffect(() => {
    entradaSubtitulo.setValue(0);
    const animacion = Animated.timing(entradaSubtitulo, { duration: 260, toValue: 1, useNativeDriver: true });
    animacion.start();
    return () => animacion.stop();
  }, [entradaSubtitulo, subtitulo]);

  let indicePalabraGlobal = 0;
  return <View accessibilityRole="header" style={styles.raiz}><MandalaAby color={acento} />{lineas.map((linea, indiceLinea) => <View key={linea.join('-')} style={styles.linea}>{linea.map((palabra) => {
    const indice = indicePalabraGlobal++;
    return <Animated.View key={palabra} style={{ opacity: entradas[indice], transform: [{ translateX: entradas[indice].interpolate({ inputRange: [0, 1], outputRange: [-22, 0] }) }] }}><Texto style={[styles.palabra, indiceLinea === 2 && styles.palabraPrincipal]}>{palabra}</Texto></Animated.View>;
  })}</View>)}<Animated.View style={{ opacity: entradaSubtitulo, transform: [{ translateY: entradaSubtitulo.interpolate({ inputRange: [0, 1], outputRange: [4, 0] }) }] }}><Texto style={[styles.subtitulo, acento && styles.subtituloActivo, acento ? { color: acento } : undefined]}>{subtitulo ?? 'Cuéntale a Lestinaty qué necesitas estudiar.'}</Texto></Animated.View></View>;
}

const styles = StyleSheet.create({ linea: { flexDirection: 'row', flexWrap: 'wrap', gap: 5, justifyContent: 'center' }, palabra: { color: '#273342', fontFamily: 'Montserrat-Bold', fontSize: 19, letterSpacing: 0.6, lineHeight: 23, textShadowColor: 'rgba(255, 255, 255, 0.82)', textShadowOffset: { height: 1, width: 0 }, textShadowRadius: 4 }, palabraPrincipal: { fontSize: 22, lineHeight: 27 }, raiz: { alignItems: 'center', gap: 1, paddingHorizontal: 22 }, subtitulo: { color: '#687484', fontFamily: 'Montserrat-Medium', fontSize: 11, lineHeight: 16, marginTop: 10, textAlign: 'center' }, subtituloActivo: { fontFamily: 'Montserrat-Bold', letterSpacing: 0.65, textShadowColor: 'rgba(255,255,255,0.94)', textShadowOffset: { height: 1, width: 0 }, textShadowRadius: 1 }, });
