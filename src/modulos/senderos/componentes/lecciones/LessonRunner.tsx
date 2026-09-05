import React, { useState } from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import { useSafeAreaInsets, SafeAreaView } from 'react-native-safe-area-context';
import { Texto } from '../../../../diseno';
import type { LeccionPack } from '../../motor/sdui/lecciones/tiposLeccion';
import { REGISTRO_LECCIONES } from './registroLecciones';

type LessonRunnerProps = {
  leccion: LeccionPack;
  color: string;
  onTerminar: (exito: boolean) => void;
};

export function LessonRunner({ leccion, color, onTerminar }: LessonRunnerProps) {
  const insets = useSafeAreaInsets();
  const [pasoActual, setPasoActual] = useState(0);
  const [vidas, setVidas] = useState(3);
  const [estadoFeedback, setEstadoFeedback] = useState<'correcto' | 'incorrecto' | null>(null);

  const paso = leccion.pasos[pasoActual];
  const WidgetComponent = REGISTRO_LECCIONES[paso.tipo];

  const avanzarPaso = () => {
    const exito = estadoFeedback === 'correcto';
    setEstadoFeedback(null);
    
    if (exito) {
      if (pasoActual + 1 < leccion.pasos.length) {
        setPasoActual(prev => prev + 1);
      } else {
        onTerminar(true);
      }
    } else {
      setVidas(prev => prev - 1);
      if (vidas - 1 <= 0) {
        onTerminar(false);
      } else {
        // En Duolingo a veces avanzas de todos modos, o a veces repites. 
        // Por ahora avancemos para ver el resto.
        if (pasoActual + 1 < leccion.pasos.length) {
          setPasoActual(prev => prev + 1);
        } else {
          onTerminar(true);
        }
      }
    }
  };

  const progresoPorcentaje = ((pasoActual) / leccion.pasos.length) * 100;

  return (
    <SafeAreaView style={styles.raiz}>
      {/* Cabecera: Barra de progreso y vidas */}
      <View style={styles.cabecera}>
        <View style={styles.barraFondo}>
          <View style={[styles.barraProgreso, { width: `${progresoPorcentaje}%`, backgroundColor: color }]} />
        </View>
        <View style={styles.vidasContenedor}>
          <Texto style={styles.textoVidas}>❤️ {vidas}</Texto>
        </View>
      </View>

      {/* Cuerpo: El Widget SDUI */}
      <View style={styles.cuerpo}>
        {WidgetComponent ? (
          <WidgetComponent paso={paso as any} color={color} onCompletado={(exito) => setEstadoFeedback(exito ? 'correcto' : 'incorrecto')} />
        ) : (
          <View style={styles.errorContenedor}>
            <Texto>Widget no implementado: {paso.tipo}</Texto>
            <Pressable style={{ marginTop: 20, padding: 10, backgroundColor: '#ddd' }} onPress={() => setEstadoFeedback('correcto')}>
              <Texto>Simular éxito (Saltar)</Texto>
            </Pressable>
          </View>
        )}
      </View>

      {/* Hoja de Feedback (Duolingo Style) */}
      {estadoFeedback && (
        <View style={[styles.feedbackContenedor, estadoFeedback === 'correcto' ? [styles.feedbackCorrecto, { backgroundColor: color }] : styles.feedbackIncorrecto, { paddingBottom: Math.max(insets.bottom, 20) }]}>
          <Texto style={[styles.feedbackTitulo, estadoFeedback === 'correcto' ? styles.textoCorrecto : styles.textoIncorrecto]}>
            {estadoFeedback === 'correcto' ? '¡Excelente!' : 'Respuesta incorrecta'}
          </Texto>
          <Pressable 
            style={[styles.botonContinuarFeedback, estadoFeedback === 'correcto' ? styles.botonFondoCorrecto : styles.botonFondoIncorrecto]} 
            onPress={avanzarPaso}
          >
            <Texto style={styles.textoBoton}>Continuar</Texto>
          </Pressable>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  raiz: { flex: 1, backgroundColor: '#FFFFFF' },
  cabecera: { flexDirection: 'row', padding: 20, alignItems: 'center', gap: 16 },
  barraFondo: { flex: 1, height: 16, backgroundColor: '#E5E7EB', borderRadius: 8, overflow: 'hidden' },
  barraProgreso: { height: '100%', borderRadius: 8 },
  vidasContenedor: { paddingHorizontal: 12, paddingVertical: 6, backgroundColor: '#FEE2E2', borderRadius: 16 },
  textoVidas: { color: '#EF4444', fontWeight: 'bold' },
  cuerpo: { flex: 1 },
  errorContenedor: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  feedbackContenedor: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    padding: 20, paddingTop: 30, paddingBottom: 40,
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
  },
  feedbackCorrecto: {},
  feedbackIncorrecto: { backgroundColor: '#ffdfe0' },
  feedbackTitulo: { fontSize: 24, fontWeight: 'bold', marginBottom: 20 },
  textoCorrecto: { color: '#FFFFFF' },
  textoIncorrecto: { color: '#ea2b2b' },
  botonContinuarFeedback: { padding: 16, borderRadius: 12, alignItems: 'center' },
  botonFondoCorrecto: { backgroundColor: 'rgba(0,0,0,0.2)' },
  botonFondoIncorrecto: { backgroundColor: '#ea2b2b' },
  textoBoton: { color: 'white', fontSize: 16, fontWeight: 'bold' }
});
