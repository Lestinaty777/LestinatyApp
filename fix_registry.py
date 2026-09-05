import re

with open('/home/arch-i7/Proyects/app/src/modulos/senderos/componentes/lecciones/registroLecciones.ts', 'w') as f:
    f.write("""import React from 'react';
import { View, Pressable, StyleSheet } from 'react-native';
import { Texto } from '../../../../diseno';
import { ComponentType } from 'react';
import type { WidgetLeccionId, PasoLeccion } from '../../motor/sdui/lecciones/tiposLeccion';
import { WidgetTeoriaCorta } from './widgets/WidgetTeoriaCorta';
import { WidgetOpcionMultiple } from './widgets/WidgetOpcionMultiple';

export type WidgetLeccionProps<T = any> = {
  paso: PasoLeccion<T>;
  onCompletado: (exito: boolean) => void;
};

// --- DUMMY COMPONENTS PARA MOCKUP ---
const DummyWidget = ({ paso, onCompletado }: any) => (
  <View style={styles.contenedor}>
    <Texto style={styles.titulo}>{paso.tipo}</Texto>
    <Texto style={{ marginBottom: 20 }}>{JSON.stringify(paso.config, null, 2)}</Texto>
    <Pressable style={styles.boton} onPress={() => onCompletado(true)}>
      <Texto style={styles.textoBoton}>¡Simular Acertar!</Texto>
    </Pressable>
    <Pressable style={[styles.boton, { backgroundColor: '#ea2b2b', marginTop: 10 }]} onPress={() => onCompletado(false)}>
      <Texto style={styles.textoBoton}>Simular Fallar</Texto>
    </Pressable>
  </View>
);

const styles = StyleSheet.create({
  contenedor: { flex: 1, padding: 20, justifyContent: 'center' },
  titulo: { fontSize: 24, fontWeight: 'bold', marginBottom: 20, color: '#5B2E91' },
  boton: { backgroundColor: '#5B2E91', padding: 16, borderRadius: 12, alignItems: 'center' },
  textoBoton: { color: 'white', fontSize: 16, fontWeight: 'bold' }
});
// ------------------------------------

export const REGISTRO_LECCIONES: Record<WidgetLeccionId, ComponentType<WidgetLeccionProps<any>>> = {
  'teoria-corta': WidgetTeoriaCorta,
  'opcion-multiple': WidgetOpcionMultiple,
  'pares-conectables': DummyWidget,
  'rellenar-huecos': DummyWidget,
  'verdadero-falso': DummyWidget,
  'ordenar-lista': DummyWidget,
  'flashcard': DummyWidget,
  'parejas-memoria': DummyWidget,
  'opcion-imagen': DummyWidget,
  'desafio-final': DummyWidget,
};
""")
