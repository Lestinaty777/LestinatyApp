import re

with open('/home/arch-i7/Proyects/app/src/modulos/senderos/componentes/lecciones/LessonRunner.tsx', 'r') as f:
    content = f.read()

# Add standard feedback UI
old_jsx = """      {/* Cuerpo: El Widget SDUI */}
      <View style={styles.cuerpo}>
        {WidgetComponent ? (
          <WidgetComponent paso={paso as any} onCompletado={manejarCompletado} />
        ) : (
          <View style={styles.errorContenedor}>
            <Texto>Widget no implementado: {paso.tipo}</Texto>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}"""

new_jsx = """      {/* Cuerpo: El Widget SDUI */}
      <View style={styles.cuerpo}>
        {WidgetComponent ? (
          <WidgetComponent paso={paso as any} onCompletado={(exito) => setEstadoFeedback(exito ? 'correcto' : 'incorrecto')} />
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
        <View style={[styles.feedbackContenedor, estadoFeedback === 'correcto' ? styles.feedbackCorrecto : styles.feedbackIncorrecto]}>
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
}"""
content = content.replace(old_jsx, new_jsx)

# Add state for feedback
old_state = """  const [pasoActual, setPasoActual] = useState(0);
  const [vidas, setVidas] = useState(3);"""

new_state = """  const [pasoActual, setPasoActual] = useState(0);
  const [vidas, setVidas] = useState(3);
  const [estadoFeedback, setEstadoFeedback] = useState<'correcto' | 'incorrecto' | null>(null);"""

content = content.replace(old_state, new_state)

# Replace manejarCompletado with avanzarPaso
old_manejar = """  const manejarCompletado = (exito: boolean) => {
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
      }
    }
  };"""

new_manejar = """  const avanzarPaso = () => {
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
  };"""

content = content.replace(old_manejar, new_manejar)

# Add styles
old_styles = """  errorContenedor: { flex: 1, justifyContent: 'center', alignItems: 'center' }
});"""
new_styles = """  errorContenedor: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  feedbackContenedor: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    padding: 20, paddingTop: 30, paddingBottom: 40,
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
  },
  feedbackCorrecto: { backgroundColor: '#d7ffb8' },
  feedbackIncorrecto: { backgroundColor: '#ffdfe0' },
  feedbackTitulo: { fontSize: 24, fontWeight: 'bold', marginBottom: 20 },
  textoCorrecto: { color: '#58a700' },
  textoIncorrecto: { color: '#ea2b2b' },
  botonContinuarFeedback: { padding: 16, borderRadius: 12, alignItems: 'center' },
  botonFondoCorrecto: { backgroundColor: '#58a700' },
  botonFondoIncorrecto: { backgroundColor: '#ea2b2b' },
  textoBoton: { color: 'white', fontSize: 16, fontWeight: 'bold' }
});"""

content = content.replace(old_styles, new_styles)

# Import Pressable if not imported
content = content.replace("import { View, StyleSheet, SafeAreaView } from 'react-native';", "import { View, StyleSheet, SafeAreaView, Pressable } from 'react-native';")


with open('/home/arch-i7/Proyects/app/src/modulos/senderos/componentes/lecciones/LessonRunner.tsx', 'w') as f:
    f.write(content)
