import React, { useEffect } from 'react';
import { Dimensions, KeyboardAvoidingView, Modal, Platform, Pressable, StyleSheet, View } from 'react-native';
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import Animated, { runOnJS, useAnimatedStyle, useSharedValue, withSpring, withTiming } from 'react-native-reanimated';

const { height: ALTO_PANTALLA } = Dimensions.get('window');
const RESORTE_ABIERTO = { damping: 20, mass: 0.85, stiffness: 190 };
const UMBRAL_CIERRE_PX = 120;
const UMBRAL_CIERRE_VELOCIDAD = 800;

type HojaDeslizanteProps = {
  alturaMaxima?: number;
  /** Usa alturaMaxima como altura fija (no como tope): necesaria si dentro hay un ScrollView largo, que si no crece hasta su contenido y el recorte de la hoja deja el final inalcanzable. */
  alturaFija?: boolean;
  children: React.ReactNode;
  onCerrar: () => void;
};

// Hoja que se desliza desde abajo sobre la pantalla actual (sin reemplazarla
// del todo): fondo con backdrop, tarjeta con esquinas redondeadas y gesto de
// arrastre para cerrar. La pantalla que la invoca sigue montada detrás.
//
// Va dentro de un Modal nativo (no un simple View absoluto) para quedar
// SIEMPRE por encima de todo, barra de navegación inferior incluida: cuando
// se invoca desde una pantalla anidada dentro de un Tabs (p. ej. Mis Hábitos,
// que vive dentro de la pestaña "Hoy"), un View absoluto solo cubre el árbol
// de esa pantalla — la barra de pestañas es una hermana renderizada aparte
// por el navegador, por encima. Modal renderiza en su propia capa nativa, así
// que no compite por z-index con nada de eso. animationType="none" porque la
// entrada/salida ya la anima Reanimated acá mismo (traslado/opacidadFondo);
// dejar que el Modal animara también duplicaría el efecto.
//
// GestureHandlerRootView anidado: react-native-gesture-handler lo exige en
// Android para que los gestos (el arrastre para cerrar) funcionen dentro de
// un Modal — el GestureHandlerRootView del root de la app no llega hasta acá,
// porque Modal monta su contenido en una ventana nativa aparte.
export function HojaDeslizante({ alturaFija = false, alturaMaxima = 0.92, children, onCerrar }: HojaDeslizanteProps) {
  const traslado = useSharedValue(ALTO_PANTALLA);
  const opacidadFondo = useSharedValue(0);

  useEffect(() => {
    traslado.value = withSpring(0, RESORTE_ABIERTO);
    opacidadFondo.value = withTiming(1, { duration: 220 });
  }, [opacidadFondo, traslado]);

  function cerrar() {
    traslado.value = withTiming(ALTO_PANTALLA, { duration: 220 });
    opacidadFondo.value = withTiming(0, { duration: 200 }, (terminado) => {
      if (terminado) runOnJS(onCerrar)();
    });
  }

  const gesto = Gesture.Pan()
    .onUpdate((evento) => {
      if (evento.translationY > 0) traslado.value = evento.translationY;
    })
    .onEnd((evento) => {
      if (evento.translationY > UMBRAL_CIERRE_PX || evento.velocityY > UMBRAL_CIERRE_VELOCIDAD) {
        runOnJS(cerrar)();
      } else {
        traslado.value = withSpring(0, RESORTE_ABIERTO);
      }
    });

  const estiloHoja = useAnimatedStyle(() => ({ transform: [{ translateY: traslado.value }] }));
  const estiloFondo = useAnimatedStyle(() => ({ opacity: opacidadFondo.value }));

  return (
    <Modal animationType="none" onRequestClose={cerrar} statusBarTranslucent transparent visible>
      {/* Modal renderiza en su propia ventana nativa — el SafeAreaProvider de
          la raíz de la app no la alcanza. Sin uno propio acá, cualquier
          useSafeAreaInsets()/SafeAreaView dentro de `children` devuelve
          valores incorrectos (ej. un CTA tapado por la barra inferior de iOS). */}
      <SafeAreaProvider>
      <GestureHandlerRootView style={StyleSheet.absoluteFill}>
        <View style={StyleSheet.absoluteFill}>
          <Animated.View style={[StyleSheet.absoluteFill, styles.fondo, estiloFondo]}>
            <Pressable accessibilityLabel="Cerrar" onPress={cerrar} style={StyleSheet.absoluteFill} />
          </Animated.View>
          <GestureDetector gesture={gesto}>
            <Animated.View style={[styles.hoja, alturaFija ? { height: ALTO_PANTALLA * alturaMaxima } : { maxHeight: ALTO_PANTALLA * alturaMaxima }, estiloHoja]}>
              <View style={styles.asa} />
              {/* Nada dentro de esta hoja llevaba TextInput hasta ahora, por
                  eso nunca hizo falta esto — sin manejo de teclado, cualquier
                  input cerca del fondo de la hoja queda tapado por el
                  teclado nativo al enfocarlo. */}
              <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.contenidoTeclado}>
                {children}
              </KeyboardAvoidingView>
            </Animated.View>
          </GestureDetector>
        </View>
      </GestureHandlerRootView>
      </SafeAreaProvider>
    </Modal>
  );
}

const styles = StyleSheet.create({
  asa: {
    alignSelf: 'center',
    backgroundColor: 'rgba(0,0,0,0.16)',
    borderRadius: 3,
    height: 5,
    marginBottom: 4,
    marginTop: 10,
    width: 40,
  },
  fondo: {
    backgroundColor: 'rgba(15, 10, 30, 0.45)',
  },
  contenidoTeclado: {
    flex: 1,
  },
  hoja: {
    backgroundColor: '#F3EEFA',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    bottom: 0,
    left: 0,
    overflow: 'hidden',
    position: 'absolute',
    right: 0,
  },
});
