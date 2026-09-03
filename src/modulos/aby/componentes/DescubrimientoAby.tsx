import { useEffect, useRef, useState } from 'react';
import { Animated, Pressable, StyleSheet, View } from 'react-native';
import { Compass, Flame, GraduationCap, Heart, LayoutDashboard, Orbit, Route, Sparkles } from 'lucide-react-native';
import type { LucideIcon } from 'lucide-react-native';

import { RecuadroGlass, Texto } from '../../../diseno';
import { hapticSeguro } from '../../../nucleo/dispositivo/haptics';
import { formasAvanceDescubrimientoAby, intencionesDescubrimientoAby, type FormaAvanceDescubrimientoAby, type IntencionDescubrimientoAby } from '../datos/descubrimientoAby';

const iconos: Record<IntencionDescubrimientoAby['icono'], LucideIcon> = { bienestar: Heart, constancia: Flame, explorar: Compass, orden: LayoutDashboard, pendiente: Orbit, aprendizaje: GraduationCap };
const iconosAvance: Record<FormaAvanceDescubrimientoAby['icono'], LucideIcon> = { explorar: Sparkles, pasos: Route, plan: LayoutDashboard };

export function DescubrimientoAby({ onCompletar, onVolver }: { onCompletar: (objetivo: string) => void; onVolver: () => void }) {
  const [paso, setPaso] = useState<'intencion' | 'avance'>('intencion');
  const [intencion, setIntencion] = useState<IntencionDescubrimientoAby | null>(null);
  const [seleccion, setSeleccion] = useState<string | null>(null);
  const opciones = paso === 'intencion' ? intencionesDescubrimientoAby : formasAvanceDescubrimientoAby;
  const entradas = useRef(opciones.map(() => new Animated.Value(0))).current;

  useEffect(() => {
    entradas.forEach((entrada) => entrada.setValue(0));
    const animacion = Animated.stagger(62, entradas.map((entrada) => Animated.timing(entrada, { duration: 340, toValue: 1, useNativeDriver: true })));
    animacion.start();
    return () => animacion.stop();
  }, [entradas, paso]);

  function seleccionarOpcion(id: string) {
    hapticSeguro('seleccion');
    setSeleccion(id);
    if (paso === 'intencion') {
      setIntencion(intencionesDescubrimientoAby.find((opcion) => opcion.id === id) ?? null);
      setPaso('avance');
      return;
    }
    if (intencion) onCompletar(`${intencion.titulo}. Prefiero avanzar con ${formasAvanceDescubrimientoAby.find((opcion) => opcion.id === id)?.titulo.toLowerCase() ?? 'acompañamiento'}.`);
  }

  function volver() {
    if (paso === 'avance') {
      setSeleccion(null);
      setPaso('intencion');
      return;
    }
    onVolver();
  }

  return <View style={styles.raiz}>
    <Texto style={styles.sobrelinea}>VAMOS A DESCUBRIRLO</Texto>
    <Texto style={styles.titulo}>{paso === 'intencion' ? 'No necesitas tenerlo claro todavía.' : 'Vamos a encontrar tu forma de avanzar.'}</Texto>
    <Texto style={styles.descripcion}>{paso === 'intencion' ? '¿Qué te gustaría que fuera distinto?' : '¿Cómo te gustaría avanzar?'}</Texto>
    <View style={styles.cuadricula}>{opciones.map((opcion, indice) => {
      const activa = seleccion === opcion.id;
      const Icono = paso === 'intencion' ? iconos[(opcion as IntencionDescubrimientoAby).icono] : iconosAvance[(opcion as FormaAvanceDescubrimientoAby).icono];
      return <Animated.View key={opcion.id} style={[styles.animada, { opacity: entradas[indice], transform: [{ translateY: entradas[indice].interpolate({ inputRange: [0, 1], outputRange: [18, 0] }) }] }]}>
        <Pressable accessibilityRole="button" accessibilityState={{ selected: activa }} onPress={() => seleccionarOpcion(opcion.id)} style={({ pressed }) => [styles.presionable, pressed && styles.presionada]}>
          <RecuadroGlass blur intensity={20} style={[styles.tarjeta, activa && styles.tarjetaActiva]}><Icono color={activa ? '#FFFFFF' : '#53606F'} size={22} strokeWidth={2.15} /><Texto style={[styles.etiqueta, activa && styles.etiquetaActiva]}>{opcion.titulo}</Texto></RecuadroGlass>
        </Pressable>
      </Animated.View>;
    })}</View>
    <Pressable accessibilityRole="button" onPress={volver} style={styles.volver}><Texto style={styles.volverTexto}>{paso === 'intencion' ? 'Volver a las categorías' : 'Cambiar respuesta'}</Texto></Pressable>
  </View>;
}

const styles = StyleSheet.create({ animada: { width: '48%' }, cuadricula: { flexDirection: 'row', flexWrap: 'wrap', gap: 9, justifyContent: 'center', marginTop: 7 }, descripcion: { color: '#67717E', fontFamily: 'Montserrat-Medium', fontSize: 12, textAlign: 'center' }, etiqueta: { color: '#45515F', fontFamily: 'Montserrat-SemiBold', fontSize: 10, lineHeight: 13, textAlign: 'center' }, etiquetaActiva: { color: '#FFFFFF' }, presionable: { height: 91 }, presionada: { opacity: 0.82, transform: [{ scale: 0.97 }] }, raiz: { alignSelf: 'center', gap: 8, width: '84%' }, sobrelinea: { color: '#647082', fontFamily: 'Montserrat-Bold', fontSize: 10, letterSpacing: 1.1, textAlign: 'center' }, tarjeta: { alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.54)', borderColor: 'rgba(255,255,255,0.74)', borderRadius: 20, borderWidth: 1, flex: 1, gap: 8, height: '100%', justifyContent: 'center', paddingHorizontal: 8 }, tarjetaActiva: { backgroundColor: '#4C6178', borderColor: 'rgba(255,255,255,0.92)' }, titulo: { color: '#273342', fontFamily: 'Montserrat-Bold', fontSize: 21, lineHeight: 26, textAlign: 'center' }, volver: { alignSelf: 'center', marginTop: 5, paddingHorizontal: 12, paddingVertical: 7 }, volverTexto: { color: '#687384', fontFamily: 'Montserrat-Medium', fontSize: 10, textDecorationLine: 'underline' } });
