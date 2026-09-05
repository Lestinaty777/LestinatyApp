import React, { useState, useEffect } from 'react';
import { View, Pressable, StyleSheet } from 'react-native';
import { Texto } from '../../../../../diseno';
import type { ConfigParesConectables } from '../../../motor/sdui/lecciones/tiposLeccion';
import type { WidgetLeccionProps } from '../registroLecciones';

export function WidgetParesConectables({ paso, onCompletado }: WidgetLeccionProps<ConfigParesConectables>) {
  const { instruccion, pares } = paso.config;
  
  // En un caso real, estas listas vendrían desordenadas (shuffle). 
  // Para el mockup las dejamos en su orden original, pero usaremos su id para validar.
  const izquierdos = pares.map((p, i) => ({ id: i, texto: p.izquierdo }));
  const derechos = pares.map((p, i) => ({ id: i, texto: p.derecho }));

  const [selIzq, setSelIzq] = useState<number | null>(null);
  const [selDer, setSelDer] = useState<number | null>(null);
  const [paresResueltos, setParesResueltos] = useState<number[]>([]);

  useEffect(() => {
    if (selIzq !== null && selDer !== null) {
      if (selIzq === selDer) {
        // Match!
        setParesResueltos(prev => [...prev, selIzq]);
        setSelIzq(null);
        setSelDer(null);
      } else {
        // No match - reset after a tiny delay
        setTimeout(() => {
          setSelIzq(null);
          setSelDer(null);
        }, 400);
      }
    }
  }, [selIzq, selDer]);

  const revisar = () => {
    if (paresResueltos.length === pares.length) {
      onCompletado(true);
    } else {
      onCompletado(false); // Shouldn't happen unless timeout
    }
  };

  const completo = paresResueltos.length === pares.length;

  return (
    <View style={styles.contenedor}>
      <Texto style={styles.instruccion}>{instruccion}</Texto>
      
      <View style={styles.columnas}>
        <View style={styles.columna}>
          {izquierdos.map((item) => {
            const resuelto = paresResueltos.includes(item.id);
            const activo = selIzq === item.id;
            return (
              <Pressable 
                key={`izq-${item.id}`} 
                style={[styles.tarjetaPar, activo && styles.tarjetaActiva, resuelto && styles.tarjetaResuelta]} 
                onPress={() => !resuelto && setSelIzq(item.id)}
              >
                <Texto style={[styles.textoPar, activo && styles.textoActivo, resuelto && styles.textoResuelto]}>{item.texto}</Texto>
              </Pressable>
            );
          })}
        </View>
        <View style={styles.columna}>
          {derechos.map((item) => {
            const resuelto = paresResueltos.includes(item.id);
            const activo = selDer === item.id;
            return (
              <Pressable 
                key={`der-${item.id}`} 
                style={[styles.tarjetaPar, activo && styles.tarjetaActiva, resuelto && styles.tarjetaResuelta]} 
                onPress={() => !resuelto && setSelDer(item.id)}
              >
                <Texto style={[styles.textoPar, activo && styles.textoActivo, resuelto && styles.textoResuelto]}>{item.texto}</Texto>
              </Pressable>
            );
          })}
        </View>
      </View>

      <Pressable 
        style={[styles.boton, !completo && styles.botonDeshabilitado]} 
        disabled={!completo}
        onPress={revisar}
      >
        <Texto style={styles.textoBoton}>Comprobar</Texto>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  contenedor: { flex: 1, padding: 20, justifyContent: 'space-between' },
  instruccion: { fontSize: 20, fontWeight: 'bold', color: '#333', marginTop: 20, marginBottom: 20 },
  columnas: { flexDirection: 'row', gap: 20, flex: 1 },
  columna: { flex: 1, gap: 12 },
  tarjetaPar: { backgroundColor: '#FFFFFF', padding: 16, borderRadius: 12, borderWidth: 2, borderColor: '#E5E5E5', alignItems: 'center', justifyContent: 'center', minHeight: 64 },
  tarjetaActiva: { borderColor: '#5B2E91', backgroundColor: '#F3E8FF' },
  tarjetaResuelta: { borderColor: '#E5E5E5', backgroundColor: '#F9FAFB', opacity: 0.5 },
  textoPar: { fontSize: 16, fontWeight: 'bold', color: '#333' },
  textoActivo: { color: '#5B2E91' },
  textoResuelto: { color: '#9CA3AF' },
  boton: { backgroundColor: '#5B2E91', padding: 16, borderRadius: 12, alignItems: 'center', marginBottom: 20 },
  botonDeshabilitado: { backgroundColor: '#D1D5DB' },
  textoBoton: { color: 'white', fontSize: 16, fontWeight: 'bold' }
});
