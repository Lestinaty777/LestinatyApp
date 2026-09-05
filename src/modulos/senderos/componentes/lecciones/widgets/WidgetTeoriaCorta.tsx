import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Texto } from '../../../../../diseno';
import type { ConfigTeoriaCorta } from '../../../motor/sdui/lecciones/tiposLeccion';
import type { WidgetLeccionProps } from '../registroLecciones';
import { TarjetaLeccion, BotonLeccion } from './Compartidos';

export function WidgetTeoriaCorta({ paso, onCompletado, color }: WidgetLeccionProps<ConfigTeoriaCorta>) {
  const { texto } = paso.config;

  return (
    <View style={styles.contenedor}>
      <View style={styles.zonaContenido}>
        <TarjetaLeccion color={color}>
          <Texto style={styles.texto}>{texto}</Texto>
        </TarjetaLeccion>
      </View>
      <BotonLeccion color={color} texto="Continuar" onPress={() => onCompletado(true)} />
    </View>
  );
}

const styles = StyleSheet.create({
  contenedor: { flex: 1, padding: 24, justifyContent: 'space-between', backgroundColor: '#FFFFFF' },
  zonaContenido: { flex: 1, justifyContent: 'center' },
  texto: { fontSize: 20, fontFamily: 'Montserrat-Bold', color: '#FFFFFF', lineHeight: 30, textAlign: 'center' },
});
