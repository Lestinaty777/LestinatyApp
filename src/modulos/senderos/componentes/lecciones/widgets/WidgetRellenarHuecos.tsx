import React, { useState } from 'react';
import { View, Pressable, StyleSheet } from 'react-native';
import { Texto } from '../../../../../diseno';
import type { ConfigRellenarHuecos } from '../../../motor/sdui/lecciones/tiposLeccion';
import type { WidgetLeccionProps } from '../registroLecciones';

export function WidgetRellenarHuecos({ paso, onCompletado }: WidgetLeccionProps<ConfigRellenarHuecos>) {
  const { textoConHuecos, opciones, respuestas } = paso.config;
  const [seleccion, setSeleccion] = useState<string | null>(null);

  // Mockup: Solo manejamos 1 hueco visualmente
  const partes = textoConHuecos.split('[HUECO_0]');

  return (
    <View style={styles.contenedor}>
      <View style={styles.zonaTexto}>
        <Texto style={styles.textoGeneral}>
          {partes[0]}
          <Texto style={[styles.hueco, seleccion ? styles.huecoLleno : {}]}>
            {seleccion ? ` ${seleccion} ` : ' ______ '}
          </Texto>
          {partes[1]}
        </Texto>
      </View>

      <View style={styles.opcionesLista}>
        {opciones.map((opc, idx) => (
          <Pressable key={idx} style={[styles.opcion, seleccion === opc && styles.opcionSel]} onPress={() => setSeleccion(opc)}>
            <Texto style={[styles.textoOpc, seleccion === opc && styles.textoOpcSel]}>{opc}</Texto>
          </Pressable>
        ))}
      </View>

      <Pressable 
        style={[styles.boton, !seleccion && styles.botonDeshabilitado]} 
        disabled={!seleccion}
        onPress={() => onCompletado(seleccion === respuestas[0])}
      >
        <Texto style={styles.textoBoton}>Comprobar</Texto>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  contenedor: { flex: 1, padding: 20, justifyContent: 'space-between' },
  zonaTexto: { marginTop: 40 },
  textoGeneral: { fontSize: 24, color: '#333', lineHeight: 36 },
  hueco: { color: '#9CA3AF', fontWeight: 'bold' },
  huecoLleno: { color: '#5B2E91', backgroundColor: '#F3E8FF', textDecorationLine: 'underline' },
  opcionesLista: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, justifyContent: 'center' },
  opcion: { borderWidth: 2, borderColor: '#E5E5E5', paddingHorizontal: 20, paddingVertical: 12, borderRadius: 20 },
  opcionSel: { borderColor: '#5B2E91', backgroundColor: '#F3E8FF' },
  textoOpc: { fontSize: 18, color: '#333' },
  textoOpcSel: { color: '#5B2E91', fontWeight: 'bold' },
  boton: { backgroundColor: '#5B2E91', padding: 16, borderRadius: 12, alignItems: 'center', marginBottom: 20 },
  botonDeshabilitado: { backgroundColor: '#D1D5DB' },
  textoBoton: { color: 'white', fontSize: 16, fontWeight: 'bold' }
});
