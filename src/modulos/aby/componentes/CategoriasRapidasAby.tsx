import { useEffect, useRef } from 'react';
import { Animated, Easing, Pressable, StyleSheet, View } from 'react-native';
import type { LucideIcon } from 'lucide-react-native';
import { Flame, GraduationCap, Handshake, Leaf, ListChecks, PiggyBank, Repeat2 } from 'lucide-react-native';

import { RecuadroGlass, Texto } from '../../../diseno';
import { hapticSeguro } from '../../../nucleo/dispositivo/haptics';
import { filasCategoriasAby, type CategoriaAby, type CategoriaAbyId } from '../datos/categoriasAby';

const iconos: Record<CategoriaAby['id'], LucideIcon> = {
  estudio: GraduationCap,
  finanzas: PiggyBank,
  habitos: Flame,
  relaciones: Handshake,
  rutinas: Repeat2,
  salud: Leaf,
  tareas: ListChecks,
};

export function CategoriasRapidasAby({ categoriaActiva, ocultar = false, onOcultas, onSeleccionar, onSinIdea }: { categoriaActiva: CategoriaAbyId | null; ocultar?: boolean; onOcultas?: () => void; onSeleccionar: (categoriaId: CategoriaAbyId) => void; onSinIdea: () => void }) {
  const salidas = useRef(Array.from({ length: 7 }, () => new Animated.Value(1))).current;

  useEffect(() => {
    if (!ocultar) {
      salidas.forEach((salida) => salida.setValue(1));
      return;
    }
    const pares = [[0, 6], [1, 5], [2, 4], [3]];
    const animacion = Animated.sequence(pares.map((par) => Animated.parallel(par.map((indice) => Animated.timing(salidas[indice], { duration: 135, easing: Easing.inOut(Easing.cubic), toValue: 0, useNativeDriver: true })))));
    animacion.start(({ finished }) => { if (finished) onOcultas?.(); });
    return () => animacion.stop();
  }, [ocultar, onOcultas, salidas]);

  return <View accessibilityLabel="Categorias de senderos" style={styles.raiz}>{filasCategoriasAby.map((fila, indiceFila) => <View key={indiceFila} style={styles.fila}>{fila.map((categoria, indiceCategoria) => {
    const indice = indiceFila * 4 + indiceCategoria;
    const direccion = indice < 3 ? -1 : 1;
    const activa = categoriaActiva === categoria.id;
    const Icono = iconos[categoria.id];
    return <Animated.View key={categoria.id} style={[styles.itemCategoria, { opacity: salidas[indice], transform: [{ translateX: salidas[indice].interpolate({ inputRange: [0, 1], outputRange: [direccion * 28, 0] }) }, { translateY: salidas[indice].interpolate({ inputRange: [0, 1], outputRange: [18, 0] }) }] }]}><Pressable accessibilityRole="button" accessibilityState={{ selected: activa }} key={categoria.id} onPress={() => { hapticSeguro('seleccion'); onSeleccionar(categoria.id); }} style={({ pressed }) => [styles.presionable, pressed && styles.presionada]}>
      <RecuadroGlass blur intensity={18} style={[styles.pastilla, activa ? { backgroundColor: categoria.color, borderColor: 'rgba(255,255,255,0.82)', shadowColor: categoria.color } : styles.pastillaInactiva]}>
        <Icono color={activa ? '#FFFFFF' : '#6D7480'} size={15} strokeWidth={2.35} />
        <Texto numberOfLines={1} style={[styles.etiqueta, activa && styles.etiquetaActiva]}>{categoria.titulo}</Texto>
      </RecuadroGlass>
    </Pressable></Animated.View>;
  })}</View>)}<Animated.View style={{ opacity: salidas[3] }}><Pressable accessibilityRole="button" onPress={() => { hapticSeguro('seleccion'); onSinIdea(); }} style={styles.sinIdea}><Texto style={styles.sinIdeaTexto}>NO SÉ QUÉ CREAR</Texto></Pressable></Animated.View></View>;
}

const styles = StyleSheet.create({ etiqueta: { color: '#6D7480', flexShrink: 1, fontFamily: 'Montserrat-Medium', fontSize: 8, lineHeight: 10 }, etiquetaActiva: { color: '#FFFFFF' }, fila: { flexDirection: 'row', gap: 6, justifyContent: 'center' }, itemCategoria: { width: '23%' }, pastilla: { alignItems: 'center', borderRadius: 999, borderWidth: 1, flexDirection: 'row', gap: 5, height: 34, justifyContent: 'center', overflow: 'hidden', paddingHorizontal: 7, shadowOffset: { height: 4, width: 0 }, shadowOpacity: 0.24, shadowRadius: 8 }, pastillaInactiva: { backgroundColor: 'rgba(255,255,255,0.56)', borderColor: 'rgba(255,255,255,0.68)', shadowOpacity: 0 }, presionable: { width: '100%' }, presionada: { opacity: 0.82, transform: [{ scale: 0.96 }] }, raiz: { alignSelf: 'center', gap: 7, width: '90%' }, sinIdea: { alignSelf: 'center', paddingHorizontal: 10, paddingVertical: 5 }, sinIdeaTexto: { color: '#5C697A', fontFamily: 'Montserrat-Bold', fontSize: 9, letterSpacing: 0.8, textDecorationLine: 'underline' } });
