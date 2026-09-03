import React, { useState } from 'react';
import { View, Pressable, StyleSheet } from 'react-native';
import { Texto, RecuadroGlass, colores } from '../../../../../diseno';
import { WidgetAccionProps } from '../tipos';
import { hapticSeguro } from '../../../../../nucleo/dispositivo/haptics';

export type ConfigDecision = { opciones: [string, string]; titulo?: string; subtitulo?: string; };

function conAlpha(color: string, alpha: string) { return `${color}${alpha}`; }

export function WidgetDecision({ color, config, estado, onEvento }: WidgetAccionProps<ConfigDecision>) {
  const [seleccion, setSeleccion] = useState<number | null>(null);

  const decidir = (index: number) => {
    if (estado === 'bloqueado' || estado === 'completado') return;
    hapticSeguro('confirmacion');
    setSeleccion(index);
    onEvento({ tipo: 'registro', widgetId: 'decision', datos: { opcion: config.opciones[index] } });
    onEvento({ tipo: 'completado', widgetId: 'decision' });
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

      <View style={styles.opcionesFila}>
        {config.opciones.map((opcion, index) => {
          const isElegido = seleccion === index || (completado && seleccion === null); // Si se autocompleta por BD
          const isOtroElegido = completado && seleccion !== null && seleccion !== index;
          
          if (isOtroElegido) return null; // Esconder la opción perdedora cuando se decide

          return (
            <Pressable
              key={index}
              onPress={() => decidir(index)}
              style={[
                styles.botonOpcion,
                { 
                  backgroundColor: isElegido ? color : 'rgba(0,0,0,0.05)',
                  borderColor: isElegido ? color : 'rgba(0,0,0,0.1)',
                  opacity: bloqueado && !completado ? 0.3 : 1
                }
              ]}
            >
              <Texto style={[styles.textoOpcion, { color: isElegido ? '#000' : colores.texto }]}>
                {opcion}
              </Texto>
            </Pressable>
          );
        })}
      </View>

    </RecuadroGlass>
  );
}

const styles = StyleSheet.create({
  contenedorWrapper: { padding: 16, borderRadius: 24, borderWidth: 1, gap: 12 },
  cabeceraTexto: { paddingHorizontal: 8, paddingTop: 4 },
  titulo: { fontFamily: 'MontserratAlternates-Bold', fontSize: 14, color: colores.texto },
  subtitulo: { fontFamily: 'MontserratAlternates-Medium', fontSize: 11, color: colores.textoSecundario, marginTop: 2 },
  opcionesFila: { flexDirection: 'row', gap: 12 },
  botonOpcion: { flex: 1, padding: 16, borderRadius: 20, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  textoOpcion: { fontFamily: 'MontserratAlternates-Bold', fontSize: 14 }
});
