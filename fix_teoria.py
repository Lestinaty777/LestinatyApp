import os

with open('src/modulos/senderos/componentes/lecciones/widgets/WidgetTeoriaCorta.tsx', 'w') as f:
    f.write("""import React from 'react';
import { View, Pressable, StyleSheet } from 'react-native';
import Svg, { Defs, Pattern, Rect } from 'react-native-svg';
import { Texto } from '../../../../../diseno';
import type { ConfigTeoriaCorta } from '../../../motor/sdui/lecciones/tiposLeccion';
import type { WidgetLeccionProps } from '../registroLecciones';

// Helper de color (Debería venir de utilidades, pero lo ponemos aquí para el mockup rápido)
function oscurecer(hexColor: string, factor = 0.7) {
  const hex = hexColor.replace('#', '');
  const canal = (inicio: number) => Math.round(parseInt(hex.slice(inicio, inicio + 2), 16) * factor).toString(16).padStart(2, '0');
  return `#${canal(0)}${canal(2)}${canal(4)}`;
}

const MosaicoFondo = () => (
  <View style={StyleSheet.absoluteFill} pointerEvents="none">
    <Svg width="100%" height="100%">
      <Defs>
        <Pattern id="ditherLeccion" patternUnits="userSpaceOnUse" width="8" height="8">
          <Rect x="4" y="0" width="4" height="4" fill="#000000" opacity="0.04" />
          <Rect x="0" y="4" width="4" height="4" fill="#000000" opacity="0.04" />
          <Rect x="0" y="0" width="4" height="4" fill="#FFFFFF" opacity="0.05" />
          <Rect x="4" y="4" width="4" height="4" fill="#FFFFFF" opacity="0.05" />
        </Pattern>
      </Defs>
      <Rect width="100%" height="100%" fill="url(#ditherLeccion)" />
    </Svg>
  </View>
);

export function WidgetTeoriaCorta({ paso, onCompletado, color }: WidgetLeccionProps<ConfigTeoriaCorta>) {
  const { texto, personaje } = paso.config;
  const colorFondo = oscurecer(color, 0.75);
  const colorSombra = oscurecer(color, 0.4);

  return (
    <View style={styles.contenedor}>
      
      <View style={styles.zonaContenido}>
        <View style={{ width: '100%' }}>
          {/* Extrusión (Sombra sólida) */}
          <View style={[styles.tarjeta, { position: 'absolute', top: 6, left: 0, right: 0, bottom: -6, backgroundColor: colorSombra }]} />
          
          {/* Tarjeta Principal */}
          <View style={[styles.tarjeta, { backgroundColor: colorFondo, overflow: 'hidden' }]}>
            <MosaicoFondo />
            <View style={{ padding: 24, minHeight: 160, justifyContent: 'center' }}>
              <Texto style={styles.texto}>{texto}</Texto>
            </View>
          </View>
        </View>
      </View>

      <View style={{ width: '100%', alignItems: 'center' }}>
        <Pressable 
          onPress={() => onCompletado(true)}
          style={({ pressed }) => [styles.botonContenedor, { width: '100%' }]}
        >
          {({ pressed }) => {
            const hundido = pressed;
            return (
              <View style={{ width: '100%', alignItems: 'center' }}>
                <View style={[styles.botonBase, styles.botonExtrusion, { backgroundColor: oscurecer(color, 0.5) }]} />
                <View style={[styles.botonBase, { 
                   backgroundColor: color,
                   transform: [{ translateY: hundido ? 4 : 0 }] 
                }]}>
                   <View style={styles.botonBisel} />
                   <Texto style={styles.textoBoton}>Continuar</Texto>
                </View>
              </View>
            );
          }}
        </Pressable>
      </View>

    </View>
  );
}

const styles = StyleSheet.create({
  contenedor: { flex: 1, padding: 24, justifyContent: 'space-between', backgroundColor: '#FFFFFF' },
  zonaContenido: { flex: 1, justifyContent: 'center' },
  tarjeta: {
    borderRadius: 20,
    width: '100%',
  },
  texto: { 
    fontSize: 20, 
    fontFamily: 'Montserrat-Bold', 
    color: '#FFFFFF', 
    lineHeight: 30,
    textAlign: 'center'
  },
  
  botonContenedor: { position: 'relative', height: 60, marginBottom: 20 },
  botonBase: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    borderRadius: 16,
    justifyContent: 'center', alignItems: 'center',
  },
  botonExtrusion: {
    top: 4, bottom: -4,
  },
  botonBisel: {
    position: 'absolute', top: 2, left: 4, right: 4, height: '40%',
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 10,
  },
  textoBoton: {
    color: '#FFFFFF',
    fontSize: 18,
    fontFamily: 'Montserrat-Bold',
  }
});
""")
