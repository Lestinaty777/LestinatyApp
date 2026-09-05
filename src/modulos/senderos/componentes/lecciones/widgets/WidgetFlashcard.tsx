import React, { useState } from 'react';
import { View, Pressable, StyleSheet } from 'react-native';
import { Texto } from '../../../../../diseno';
import type { ConfigFlashcard } from '../../../motor/sdui/lecciones/tiposLeccion';
import type { WidgetLeccionProps } from '../registroLecciones';

export function WidgetFlashcard({ paso, onCompletado }: WidgetLeccionProps<ConfigFlashcard>) {
  const { frente, dorso } = paso.config;
  const [volteada, setVolteada] = useState(false);

  return (
    <View style={styles.contenedor}>
      <Texto style={styles.instruccion}>Toca la tarjeta para voltearla</Texto>
      
      <Pressable style={[styles.tarjeta, volteada && styles.tarjetaDorso]} onPress={() => setVolteada(!volteada)}>
        <Texto style={[styles.textoTarjeta, volteada && styles.textoDorso]}>
          {volteada ? dorso : frente}
        </Texto>
      </Pressable>

      <View style={[styles.acciones, !volteada && { opacity: 0 }]} pointerEvents={volteada ? 'auto' : 'none'}>
        <Texto style={styles.pregunta}>¿Te la sabías?</Texto>
        <View style={styles.botonesAccion}>
          <Pressable style={[styles.botonAccion, { backgroundColor: '#ea2b2b' }]} onPress={() => onCompletado(false)}>
            <Texto style={styles.textoBoton}>No</Texto>
          </Pressable>
          <Pressable style={[styles.botonAccion, { backgroundColor: '#58a700' }]} onPress={() => onCompletado(true)}>
            <Texto style={styles.textoBoton}>Sí</Texto>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  contenedor: { flex: 1, padding: 20, alignItems: 'center' },
  instruccion: { fontSize: 16, color: '#666', marginTop: 20, marginBottom: 20 },
  tarjeta: { width: '100%', height: 300, backgroundColor: '#FFFFFF', borderRadius: 24, justifyContent: 'center', alignItems: 'center', padding: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 10, elevation: 5, borderWidth: 2, borderColor: '#5B2E91' },
  tarjetaDorso: { backgroundColor: '#5B2E91' },
  textoTarjeta: { fontSize: 24, fontWeight: 'bold', color: '#5B2E91', textAlign: 'center' },
  textoDorso: { color: '#FFFFFF' },
  acciones: { width: '100%', marginTop: 40, alignItems: 'center' },
  pregunta: { fontSize: 18, fontWeight: 'bold', marginBottom: 20, color: '#333' },
  botonesAccion: { flexDirection: 'row', gap: 16, width: '100%' },
  botonAccion: { flex: 1, padding: 16, borderRadius: 12, alignItems: 'center' },
  textoBoton: { color: 'white', fontSize: 16, fontWeight: 'bold' }
});
