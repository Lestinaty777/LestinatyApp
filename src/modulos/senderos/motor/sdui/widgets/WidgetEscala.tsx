import React, { useState } from 'react';
import { View, Pressable, StyleSheet } from 'react-native';
import { Check } from 'lucide-react-native';
import { Texto, RecuadroGlass, colores, generarPaleta } from '../../../../../diseno';
import { WidgetAccionProps } from '../tipos';
import { hapticSeguro } from '../../../../../nucleo/dispositivo/haptics';

export type ConfigEscala = { min: number; max: number; etiquetas?: [string, string]; titulo?: string; subtitulo?: string; };

function conAlpha(color: string, alpha: string) { return `${color}${alpha}`; }

export function WidgetEscala({ color, config, estado, onEvento }: WidgetAccionProps<ConfigEscala>) {
  const [valor, setValor] = useState<number | null>(null);

  const maxNodos = Math.min(config.max - config.min + 1, 10);
  const paleta = generarPaleta(color, maxNodos);

  const seleccionar = (val: number) => {
    if (estado === 'bloqueado' || estado === 'completado') return;
    hapticSeguro('seleccion');
    setValor(val);
  };

  const confirmar = () => {
    if (estado === 'bloqueado' || valor === null) return;
    hapticSeguro('confirmacion');
    onEvento({ tipo: 'registro', widgetId: 'escala', datos: { valor } });
    onEvento({ tipo: 'completado', widgetId: 'escala' });
  };

  const bloqueado = estado === 'bloqueado';
  const completado = estado === 'completado';

  return (
    <RecuadroGlass blur intensity={30} style={[styles.contenedorWrapper, { borderColor: completado ? color : conAlpha(color, '30') }]}>
      
      {(config.titulo || config.subtitulo) && (
        <View style={styles.cabeceraTexto}>
          {config.titulo && <Texto style={styles.titulo}>{config.titulo}</Texto>}
          {config.subtitulo && <Texto style={styles.subtitulo}>{config.subtitulo}</Texto>}
        </View>
      )}

      <View style={styles.contenedorFila}>
        
        <View style={styles.centro}>
          {/* El contenedor principal de la Escala con contorno de pastilla */}
          <View style={styles.escalaTrack}>
            {Array.from({ length: maxNodos }).map((_, i) => {
              const valNodo = config.min + i;
              const isSeleccionado = valor !== null && valNodo <= valor;
              const colorNodo = paleta[i];
              
              return (
                <Pressable
                  key={valNodo}
                  onPress={() => seleccionar(valNodo)}
                  style={[
                    styles.nodo,
                    { 
                      backgroundColor: isSeleccionado ? colorNodo : 'transparent',
                      // El nodo activo resalta sutilmente sobre los demás
                      transform: [{ scale: isSeleccionado && valNodo === valor ? 1.15 : 1 }]
                    }
                  ]}
                />
              );
            })}
          </View>
          
          {config.etiquetas && (
            <View style={styles.etiquetasContainer}>
              <Texto style={styles.etiqueta}>{config.etiquetas[0]}</Texto>
              <Texto style={styles.etiqueta}>{config.etiquetas[1]}</Texto>
            </View>
          )}
        </View>

        <Pressable 
          onPress={confirmar} 
          style={[styles.boton, { backgroundColor: completado ? color : conAlpha(color, '20'), opacity: (bloqueado || valor === null) && !completado ? 0.3 : 1 }]}
        >
          {completado ? <Texto style={styles.valorFinal}>{valor}</Texto> : <Check color={color} size={20} />}
        </Pressable>

      </View>
    </RecuadroGlass>
  );
}

const styles = StyleSheet.create({
  contenedorWrapper: { padding: 16, borderRadius: 24, borderWidth: 1, gap: 8 },
  cabeceraTexto: { paddingHorizontal: 8, paddingTop: 4 },
  titulo: { fontFamily: 'MontserratAlternates-Bold', fontSize: 14, color: colores.texto },
  subtitulo: { fontFamily: 'MontserratAlternates-Medium', fontSize: 11, color: colores.textoSecundario, marginTop: 2 },
  contenedorFila: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  centro: { flex: 1, justifyContent: 'center' },
  
  // Track rediseñado como pastilla con borde exterior
  escalaTrack: { 
    flexDirection: 'row', 
    alignItems: 'stretch',
    height: 36, 
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
    backgroundColor: 'rgba(0,0,0,0.02)',
    padding: 4,
    gap: 4
  },
  nodo: { 
    flex: 1, 
    borderRadius: 12 
  },
  
  etiquetasContainer: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8, paddingHorizontal: 4 },
  etiqueta: { fontFamily: 'MontserratAlternates-Medium', fontSize: 10, color: colores.textoSecundario },
  boton: { width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center' },
  valorFinal: { fontFamily: 'MontserratAlternates-Bold', fontSize: 24, color: '#FFFFFF' } // Blanco para que resalte
});
