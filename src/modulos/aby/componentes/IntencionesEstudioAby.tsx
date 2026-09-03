import { useEffect, useRef } from 'react';
import { Animated, Easing, Pressable, StyleSheet, View } from 'react-native';
import { CalendarClock, FileText, Flame, GraduationCap, type LucideIcon } from 'lucide-react-native';

import { RecuadroGlass, Texto } from '../../../diseno';
import { hapticSeguro } from '../../../nucleo/dispositivo/haptics';
import { intencionesEstudioAby, type IntencionEstudioAby, type IntencionEstudioAbyId } from '../datos/intencionesEstudioAby';

const iconos: Record<IntencionEstudioAby['icono'], LucideIcon> = {
  archivo: FileText,
  birrete: GraduationCap,
  calendario: CalendarClock,
  fuego: Flame,
};

type Props = {
  intencionActiva: IntencionEstudioAbyId | null;
  onSeleccionar: (intencion: IntencionEstudioAbyId) => void;
};

export function IntencionesEstudioAby({ intencionActiva, onSeleccionar }: Props) {
  const presiones = useRef(intencionesEstudioAby.map(() => new Animated.Value(1))).current;

  useEffect(() => {
    const indice = intencionesEstudioAby.findIndex((item) => item.id === intencionActiva);
    if (indice < 0) return;
    const animacion = Animated.sequence([
      Animated.timing(presiones[indice], { duration: 100, easing: Easing.out(Easing.cubic), toValue: 0.965, useNativeDriver: true }),
      Animated.spring(presiones[indice], { bounciness: 6, speed: 15, toValue: 1, useNativeDriver: true }),
    ]);
    animacion.start();
    return () => animacion.stop();
  }, [intencionActiva, presiones]);

  return <View accessibilityLabel="Formas de crear un sendero de estudio" style={styles.raiz}>{intencionesEstudioAby.map((intencion, indice) => {
    const activa = intencion.id === intencionActiva;
    const Icono = iconos[intencion.icono];
    return <Animated.View key={intencion.id} style={[styles.item, { transform: [{ scale: presiones[indice] }] }]}>
      <Pressable accessibilityRole="button" accessibilityState={{ selected: activa }} onPress={() => { hapticSeguro('seleccion'); onSeleccionar(intencion.id); }} style={({ pressed }) => [styles.presionable, pressed && styles.presionada]}>
        <RecuadroGlass blur intensity={20} style={[
          styles.tarjeta,
          activa ? { backgroundColor: `${intencion.color}20`, borderColor: `${intencion.color}8A`, shadowColor: intencion.color, shadowOpacity: 0.24 } : styles.tarjetaBase,
        ]}>
          <View style={[styles.icono, activa && { backgroundColor: intencion.color }]}><Icono color={activa ? '#FFFFFF' : intencion.color} size={18} strokeWidth={2.35} /></View>
          <Texto style={[styles.titulo, activa && { color: intencion.color }]}>{intencion.titulo}</Texto>
          <Texto style={styles.descripcion}>{intencion.descripcion}</Texto>
        </RecuadroGlass>
      </Pressable>
    </Animated.View>;
  })}</View>;
}

const styles = StyleSheet.create({
  descripcion: { color: '#697687', fontFamily: 'Montserrat-Medium', fontSize: 10, lineHeight: 14 },
  icono: { alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.58)', borderRadius: 11, height: 30, justifyContent: 'center', width: 30 },
  item: { width: '48.5%' },
  presionable: { width: '100%' },
  presionada: { opacity: 0.9 },
  raiz: { alignSelf: 'center', flexDirection: 'row', flexWrap: 'wrap', gap: 9, justifyContent: 'space-between', width: '84%' },
  tarjeta: { borderRadius: 20, borderWidth: 1, gap: 6, minHeight: 122, overflow: 'hidden', padding: 12, shadowOffset: { height: 5, width: 0 }, shadowRadius: 12 },
  tarjetaBase: { backgroundColor: 'rgba(255,255,255,0.48)', borderColor: 'rgba(255,255,255,0.7)', shadowColor: '#5A6471', shadowOpacity: 0.07 },
  titulo: { color: '#334153', fontFamily: 'Montserrat-Bold', fontSize: 12, lineHeight: 15, marginTop: 1 },
});
