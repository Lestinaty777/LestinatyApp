import React, { useState } from 'react';
import { View, Pressable, StyleSheet } from 'react-native';
import { Texto } from '../../../../../diseno';
import type { ConfigVerdaderoFalso } from '../../../motor/sdui/lecciones/tiposLeccion';
import type { WidgetLeccionProps } from '../registroLecciones';

export function WidgetVerdaderoFalso({ paso, onCompletado }: WidgetLeccionProps<ConfigVerdaderoFalso>) {
  const { afirmacion, esVerdadero } = paso.config;
  const [seleccion, setSeleccion] = useState<boolean | null>(null);

  const revisar = () => {
    if (seleccion === null) return;
    onCompletado(seleccion === esVerdadero);
  };

  return (
    <View style={styles.contenedor}>
      <View style={styles.tarjeta}>
        <Texto style={styles.pregunta}>{afirmacion}</Texto>
      </View>
      
      <View style={styles.botonesColumna}>
        <Pressable 
          style={[styles.botonOpcion, seleccion === true && styles.botonOpcionSeleccionadoVerdadero]} 
          onPress={() => setSeleccion(true)}
        >
          <Texto style={[styles.textoOpcion, seleccion === true && styles.textoOpcionSeleccionado]}>Verdadero</Texto>
        </Pressable>
        <Pressable 
          style={[styles.botonOpcion, seleccion === false && styles.botonOpcionSeleccionadoFalso]} 
          onPress={() => setSeleccion(false)}
        >
          <Texto style={[styles.textoOpcion, seleccion === false && styles.textoOpcionSeleccionado]}>Falso</Texto>
        </Pressable>
      </View>

      <Pressable 
        style={[styles.boton, seleccion === null && styles.botonDeshabilitado]} 
        disabled={seleccion === null}
        onPress={revisar}
      >
        <Texto style={styles.textoBoton}>Comprobar</Texto>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  contenedor: { flex: 1, padding: 20, justifyContent: 'space-between' },
  tarjeta: { backgroundColor: '#F3E8FF', padding: 30, borderRadius: 16, marginTop: 20, alignItems: 'center' },
  pregunta: { fontSize: 22, fontWeight: 'bold', color: '#5B2E91', textAlign: 'center' },
  botonesColumna: { gap: 16 },
  botonOpcion: { borderWidth: 2, borderColor: '#E5E5E5', borderRadius: 16, padding: 20, alignItems: 'center' },
  botonOpcionSeleccionadoVerdadero: { borderColor: '#58a700', backgroundColor: '#d7ffb8' },
  botonOpcionSeleccionadoFalso: { borderColor: '#ea2b2b', backgroundColor: '#ffdfe0' },
  textoOpcion: { fontSize: 18, color: '#333', fontWeight: 'bold' },
  textoOpcionSeleccionado: { color: '#333' },
  boton: { backgroundColor: '#5B2E91', padding: 16, borderRadius: 12, alignItems: 'center', marginBottom: 20 },
  botonDeshabilitado: { backgroundColor: '#D1D5DB' },
  textoBoton: { color: 'white', fontSize: 16, fontWeight: 'bold' }
});
