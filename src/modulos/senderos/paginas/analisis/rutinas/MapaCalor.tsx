import React from 'react';
import { View, StyleSheet, Text } from 'react-native';
import { Texto, colores } from '../../../../../diseno';
import Reanimated, { FadeIn } from 'react-native-reanimated';
import { ActividadDiaria } from './tipos';

export function MapaCalor({ datos, acento }: { datos: ActividadDiaria[], acento: string }) {
  if (!datos || datos.length === 0) return null;
  // Función auxiliar para opacidad
  const conAlpha = (color: string, alpha: string) => {
    return `${color}${alpha}`;
  };

  return (
    <View style={{ width: '100%' }}>
      {/* Etiquetas de Días */}
      <View style={styles.diasFila}>
        {['L', 'M', 'M', 'J', 'V', 'S', 'D'].map((letra, i) => (
          <Texto key={i} style={styles.letraDia}>{letra}</Texto>
        ))}
      </View>

    <View style={styles.grid}>
        {datos.map((dia, index) => {
        const intensidad = dia.total === 0 ? 0 : dia.completadas / dia.total;
        let opacity = 0.05;
        if (intensidad > 0 && intensidad < 0.5) opacity = 0.4;
        else if (intensidad >= 0.5 && intensidad < 1) opacity = 0.7;
        else if (intensidad === 1) opacity = 1;

        const vacio = intensidad === 0;
        return (
          <Reanimated.View 
            key={dia.fecha}
            entering={FadeIn.delay(index * 15).duration(300)}
            style={[
              styles.celda, 
              { 
                backgroundColor: vacio ? 'rgba(255,255,255,0.03)' : acento,
                opacity: vacio ? 1 : opacity,
                borderColor: vacio ? conAlpha(acento, '30') : 'transparent',
                borderWidth: vacio ? 1 : 0
              }
            ]} 
          />
        );
      })}
    </View>

      {/* Simbología */}
      <View style={styles.leyenda}>
        <Texto style={styles.leyendaTexto}>Menos</Texto>
        <View style={[styles.celdaLeyenda, { backgroundColor: 'rgba(255,255,255,0.03)', borderColor: conAlpha(acento, '30'), borderWidth: 1 }]} />
        <View style={[styles.celdaLeyenda, { backgroundColor: acento, opacity: 0.4 }]} />
        <View style={[styles.celdaLeyenda, { backgroundColor: acento, opacity: 0.7 }]} />
        <View style={[styles.celdaLeyenda, { backgroundColor: acento, opacity: 1 }]} />
        <Texto style={styles.leyendaTexto}>Más</Texto>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  diasFila: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: 2, // Slight padding to align letters over columns
    marginBottom: 2,
    marginTop: 6
  },
  letraDia: {
    width: '12%',
    textAlign: 'center',
    fontFamily: 'MontserratAlternates-SemiBold',
    fontSize: 10,
    color: colores.textoSecundario,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    justifyContent: 'space-between',
    marginTop: 4,
    width: '100%'
  },
  celda: {
    width: '12%', 
    aspectRatio: 1,
    borderRadius: 6,
    minHeight: 20
  }

,  leyenda: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', marginTop: 4, gap: 6 },
  celdaLeyenda: { width: 12, height: 12, borderRadius: 3 },
  leyendaTexto: { fontFamily: 'MontserratAlternates-Medium', fontSize: 10, color: colores.textoSecundario }
});
