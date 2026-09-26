import React, { useState } from 'react';
import { View, Pressable, StyleSheet } from 'react-native';
import { Texto } from '../../../../../diseno';
import type { ConfigOpcionMultiple } from '../../../motor/sdui/lecciones/tiposLeccion';
import type { WidgetLeccionProps } from '../registroLecciones';
import { TarjetaLeccion, BotonLeccion } from './Compartidos';

export function WidgetOpcionMultiple({ paso, onCompletado, color }: WidgetLeccionProps<ConfigOpcionMultiple>) {
  const { pregunta, opciones, indiceCorrecto } = paso.config;
  const [seleccion, setSeleccion] = useState<number | null>(null);

  const revisar = () => {
    if (seleccion === null) return;
    onCompletado(seleccion === indiceCorrecto);
  };

  return (
    <View style={styles.contenedor}>
      <Texto style={[styles.pregunta, { color: color }]}>{pregunta}</Texto>
      <View style={styles.opciones}>
        {opciones.map((opc, idx) => (
          <Pressable key={idx} onPress={() => setSeleccion(idx)}>
            <TarjetaLeccion color={color} selected={seleccion === idx} minHeight={80}>
              <Texto style={styles.textoOpcion}>{opc}</Texto>
            </TarjetaLeccion>
          </Pressable>
        ))}
      </View>
      <BotonLeccion color={color} texto="Comprobar" onPress={revisar} deshabilitado={seleccion === null} />
    </View>
  );
}

const styles = StyleSheet.create({
  contenedor: { flex: 1, padding: 24, justifyContent: 'space-between', backgroundColor: '#FFFFFF' },
  pregunta: { fontSize: 24, lineHeight: 29, fontFamily: 'Montserrat-Bold', marginTop: 20, marginBottom: 20 },
  opciones: { gap: 12, flex: 1, justifyContent: 'center' },
  textoOpcion: { fontSize: 18, fontFamily: 'Montserrat-Bold', color: '#FFFFFF', textAlign: 'center' }
});
