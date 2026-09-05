import React from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import Svg, { Defs, Pattern, Rect } from 'react-native-svg';
import { Texto } from '../../../../../diseno';

export function oscurecer(hexColor: string, factor = 0.7) {
  const hex = hexColor.replace('#', '');
  const canal = (inicio: number) => Math.round(parseInt(hex.slice(inicio, inicio + 2), 16) * factor).toString(16).padStart(2, '0');
  return `#${canal(0)}${canal(2)}${canal(4)}`;
}

export const MosaicoFondo = () => (
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

export function TarjetaLeccion({ color, children, minHeight = 160, selected = false }: { color: string, children: React.ReactNode, minHeight?: number, selected?: boolean }) {
  const colorFondo = selected ? oscurecer(color, 0.9) : oscurecer(color, 0.75);
  const colorSombra = oscurecer(color, 0.4);

  return (
    <View style={{ width: '100%', marginBottom: 12 }}>
      {/* Extrusión (Sombra sólida) */}
      <View style={[styles.tarjeta, { position: 'absolute', top: 6, left: 0, right: 0, bottom: -6, backgroundColor: colorSombra }]} />
      
      {/* Tarjeta Principal */}
      <View style={[styles.tarjeta, { backgroundColor: colorFondo, overflow: 'hidden', borderWidth: selected ? 2 : 0, borderColor: '#FFFFFF' }]}>
        <MosaicoFondo />
        <View style={{ padding: 24, minHeight, justifyContent: 'center' }}>
          {children}
        </View>
      </View>
    </View>
  );
}

export function BotonLeccion({ color, texto, onPress, deshabilitado = false }: { color: string, texto: string, onPress: () => void, deshabilitado?: boolean }) {
  const baseColor = deshabilitado ? '#D1D5DB' : color;
  const shadowColor = deshabilitado ? '#9CA3AF' : oscurecer(color, 0.5);

  return (
    <View style={{ width: '100%', alignItems: 'center' }}>
      <Pressable 
        disabled={deshabilitado}
        onPress={onPress}
        style={({ pressed }) => [styles.botonContenedor, { width: '100%' }]}
      >
        {({ pressed }) => {
          const hundido = pressed || deshabilitado;
          return (
            <View style={{ width: '100%', alignItems: 'center' }}>
              <View style={[styles.botonBase, styles.botonExtrusion, { backgroundColor: shadowColor, display: deshabilitado ? 'none' : 'flex' }]} />
              <View style={[styles.botonBase, { backgroundColor: baseColor, transform: [{ translateY: hundido ? 4 : 0 }] }]}>
                 {!deshabilitado && <View style={styles.botonBisel} />}
                 <Texto style={styles.textoBoton}>{texto}</Texto>
              </View>
            </View>
          );
        }}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  tarjeta: { borderRadius: 20, width: '100%' },
  botonContenedor: { position: 'relative', height: 60, marginBottom: 20 },
  botonBase: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    borderRadius: 16, justifyContent: 'center', alignItems: 'center',
  },
  botonExtrusion: { top: 4, bottom: -4 },
  botonBisel: {
    position: 'absolute', top: 2, left: 4, right: 4, height: '40%',
    backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 10,
  },
  textoBoton: { color: '#FFFFFF', fontSize: 18, fontFamily: 'Montserrat-Bold' }
});
