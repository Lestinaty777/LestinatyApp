import { useEffect, useRef } from 'react';
import { Animated, Easing, Image, type ImageSourcePropType, StyleSheet, View } from 'react-native';

import { colorEnvioCategoriaAby, type CategoriaAbyId } from '../datos/categoriasAby';
import { AuroraBiomaAby } from './AuroraBiomaAby';
import { obtenerDecoracionBiomaAby, type ArbolBiomaAbyId } from './decoracionBiomaAby.config';

const arboles: Record<ArbolBiomaAbyId, ImageSourcePropType> = {
  arce: require('../../../../assets/ilustraciones/senderos/biomas/arboles/arce-01.png'),
  'bosque-calido': require('../../../../assets/ilustraciones/senderos/biomas/arboles/bosque-calido-01.png'),
  'bosque-dorado': require('../../../../assets/ilustraciones/senderos/biomas/arboles/bosque-dorado-01.png'),
  'cerezo-01': require('../../../../assets/ilustraciones/senderos/biomas/arboles/cerezo-01.png'),
  'cerezo-02': require('../../../../assets/ilustraciones/senderos/biomas/arboles/cerezo-02.png'),
  'pino-nevado': require('../../../../assets/ilustraciones/senderos/biomas/arboles/pino-nevado-01.png'),
  'sauce-ruinas': require('../../../../assets/ilustraciones/senderos/biomas/arboles/sauce-ruinas-01.png'),
  selva: require('../../../../assets/ilustraciones/senderos/biomas/arboles/selva-01.png'),
};

function ArbolesBiomaAby({ inferior, superior }: { inferior: ArbolBiomaAbyId; superior: ArbolBiomaAbyId }) {
  const entrada = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const animacion = Animated.timing(entrada, { duration: 620, easing: Easing.out(Easing.cubic), toValue: 1, useNativeDriver: true });
    animacion.start();
    return () => animacion.stop();
  }, [entrada]);
  return <Animated.View pointerEvents="none" style={[styles.decoracion, { opacity: entrada }]}>
    <Animated.View style={[styles.arbolInferior, { transform: [{ translateY: entrada.interpolate({ inputRange: [0, 1], outputRange: [30, 0] }) }] }]}><Image resizeMode="contain" source={arboles[inferior]} style={styles.imagenInferior} /></Animated.View>
    <Animated.View style={[styles.arbolSuperior, { transform: [{ translateY: entrada.interpolate({ inputRange: [0, 1], outputRange: [-22, 0] }) }, { scaleX: -1 }] }]}><Image resizeMode="contain" source={arboles[superior]} style={styles.imagenSuperior} /></Animated.View>
  </Animated.View>;
}

export function FondoBiomaAby({ auroraNeutra = false, categoriaActiva }: { auroraNeutra?: boolean; categoriaActiva: CategoriaAbyId | null }) {
  const decoracion = obtenerDecoracionBiomaAby(categoriaActiva);
  const velo = useRef(new Animated.Value(0)).current;
  const acento = categoriaActiva ? colorEnvioCategoriaAby(categoriaActiva) : '#697380';

  useEffect(() => {
    velo.setValue(0.7);
    const animacion = Animated.timing(velo, { duration: 520, easing: Easing.out(Easing.cubic), toValue: 0, useNativeDriver: true });
    animacion.start();
    return () => animacion.stop();
  }, [categoriaActiva, velo]);

  return <View pointerEvents="none" style={[styles.raiz, { backgroundColor: decoracion.colorPastel }]}>
    {decoracion.arbolInferior && decoracion.arbolSuperior ? <ArbolesBiomaAby inferior={decoracion.arbolInferior} key={categoriaActiva} superior={decoracion.arbolSuperior} /> : null}
    <AuroraBiomaAby acento={acento} visible={Boolean(categoriaActiva) || auroraNeutra} />
    <Animated.View style={[styles.velo, { opacity: velo }]} />
  </View>;
}

const styles = StyleSheet.create({ arbolInferior: { bottom: -42, left: -84, position: 'absolute' }, arbolSuperior: { bottom: -34, position: 'absolute', right: -50 }, decoracion: { bottom: 0, left: 0, position: 'absolute', right: 0, top: 0 }, imagenInferior: { height: 254, width: 254 }, imagenSuperior: { height: 184, width: 184 }, raiz: { bottom: 0, left: 0, overflow: 'hidden', position: 'absolute', right: 0, top: 0 }, velo: { backgroundColor: '#FFFFFF', bottom: 0, left: 0, position: 'absolute', right: 0, top: 0 } });
