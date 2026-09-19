import { Image, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { MasterGlass, Texto } from '../../../diseno';
import { AuroraBoreal } from '../../hoy/componentes/AuroraBoreal';
import { FormularioAccesoOnboarding } from '../componentes/FormularioAccesoOnboarding';

const C = { texto: '#1A1335', tenue: '#648170' };

// Pantalla de reentrada en frío: cuando el dispositivo ya vio el carrusel de
// introducción (que ahora incluye el login como su slide 5) pero la app se
// cierra sin haber iniciado sesión, el próximo arranque frío no vuelve a
// mostrar los 4 slides de marketing — cae directo acá. Misma decoración de
// Esmeralda, mismo formulario (FormularioAccesoOnboarding, compartido con el
// slide 5 del carrusel) — cero lógica de login duplicada.
export function AccesoOnboardingPantalla() {
  const insets = useSafeAreaInsets();

  return (
    <LinearGradient colors={['#F7FDF7', '#E8F7E9', '#D5F2D7']} end={{ x: 0, y: 1 }} start={{ x: 0, y: 0 }} style={s.raiz}>
      <View pointerEvents="none" style={s.aurora}>
        <AuroraBoreal tema="verde" />
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={s.raiz}>
        <ScrollView contentContainerStyle={[s.contenido, { paddingTop: insets.top + 24, paddingBottom: insets.bottom + 24 }]} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <MasterGlass style={s.panel}>
            <View style={s.hero}>
              <View style={s.heroImagenContenedor}>
                <Image
                  resizeMode="contain"
                  source={require('../../../../assets/ilustraciones/senderos/biomas/paquetes/Esmeralda/arbusto.png')}
                  style={s.heroImagen}
                />
              </View>

              <Texto style={s.titulo}>Tu jardín te espera</Texto>
              <Texto style={s.subtitulo}>Iniciá sesión para seguir cultivando tus hábitos.</Texto>

              <LinearGradient
                colors={['rgba(37,136,76,0)', 'rgba(37,136,76,0.32)', 'rgba(37,136,76,0)']}
                end={{ x: 1, y: 0 }}
                start={{ x: 0, y: 0 }}
                style={s.separador}
              />
            </View>

            <FormularioAccesoOnboarding />
          </MasterGlass>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const s = StyleSheet.create({
  raiz: { flex: 1 },
  aurora: { bottom: 0, left: 0, position: 'absolute', right: 0, top: 0 },
  contenido: { flexGrow: 1, justifyContent: 'flex-end', paddingHorizontal: 24 },
  panel: { alignItems: 'center', paddingHorizontal: 24, paddingVertical: 28 },
  hero: { alignItems: 'center', gap: 6, width: '100%' },
  heroImagenContenedor: { alignItems: 'center', height: 90, justifyContent: 'center', width: 120 },
  heroImagen: { height: 75, width: 75 },
  separador: { alignSelf: 'center', borderRadius: 1, height: 1.5, marginTop: 8, width: 64 },
  titulo: { color: C.texto, fontFamily: 'MontserratAlternates-Bold', fontSize: 24, marginTop: -6, textAlign: 'center', width: '100%' },
  subtitulo: { color: C.tenue, fontFamily: 'Montserrat-Medium', fontSize: 13, lineHeight: 18, textAlign: 'center', width: '100%' },
});
