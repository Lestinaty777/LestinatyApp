import React, { useState } from 'react';
import { View, Pressable, StyleSheet } from 'react-native';
import { Texto } from '../../../../../diseno';
import type { ConfigOrdenarLista } from '../../../motor/sdui/lecciones/tiposLeccion';
import type { WidgetLeccionProps } from '../registroLecciones';

export function WidgetOrdenarLista({ paso, onCompletado }: WidgetLeccionProps<ConfigOrdenarLista>) {
  const { instruccion, elementosDesordenados, elementosOrdenados } = paso.config;
  const [lista, setLista] = useState(elementosDesordenados);

  // Mockup simple: Tocar dos elementos los intercambia
  const [sel, setSel] = useState<number | null>(null);

  const tocar = (idx: number) => {
    if (sel === null) {
      setSel(idx);
    } else {
      const nueva = [...lista];
      const temp = nueva[idx];
      nueva[idx] = nueva[sel];
      nueva[sel] = temp;
      setLista(nueva);
      setSel(null);
    }
  };

  const revisar = () => {
    const correcto = lista.join(',') === elementosOrdenados.join(',');
    onCompletado(correcto);
  };

  return (
    <View style={styles.contenedor}>
      <Texto style={styles.instruccion}>{instruccion}</Texto>
      <View style={styles.lista}>
        {lista.map((el, i) => (
          <Pressable key={i} style={[styles.item, sel === i && styles.itemSel]} onPress={() => tocar(i)}>
            <Texto style={styles.textoItem}>{el}</Texto>
          </Pressable>
        ))}
      </View>
      <Pressable style={styles.boton} onPress={revisar}>
        <Texto style={styles.textoBoton}>Comprobar</Texto>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  contenedor: { flex: 1, padding: 20, justifyContent: 'space-between' },
  instruccion: { fontSize: 20, fontWeight: 'bold', marginBottom: 20 },
  lista: { gap: 12 },
  item: { backgroundColor: '#F9FAFB', padding: 20, borderRadius: 12, borderWidth: 2, borderColor: '#E5E5E5', alignItems: 'center' },
  itemSel: { borderColor: '#5B2E91', backgroundColor: '#F3E8FF' },
  textoItem: { fontSize: 18, fontWeight: 'bold', color: '#333' },
  boton: { backgroundColor: '#5B2E91', padding: 16, borderRadius: 12, alignItems: 'center', marginBottom: 20 },
  textoBoton: { color: 'white', fontSize: 16, fontWeight: 'bold' }
});
