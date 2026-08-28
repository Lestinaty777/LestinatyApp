import React from 'react';
import { View, StyleSheet } from 'react-native';
import Reanimated, { FadeIn } from 'react-native-reanimated';
import { ActividadDiaria } from './tipos';

export function MapaCalor({ datos, acento }: { datos: ActividadDiaria[], acento: string }) {
  // datos expected to be 28 items (4 weeks x 7 days)
  
  return (
    <View style={styles.grid}>
      {datos.map((dia, index) => {
        const intensidad = dia.total === 0 ? 0 : dia.completadas / dia.total;
        let opacity = 0.05;
        if (intensidad > 0 && intensidad < 0.5) opacity = 0.4;
        else if (intensidad >= 0.5 && intensidad < 1) opacity = 0.7;
        else if (intensidad === 1) opacity = 1;

        return (
          <Reanimated.View 
            key={dia.fecha}
            entering={FadeIn.delay(index * 15).duration(300)}
            style={[
              styles.celda, 
              { 
                backgroundColor: intensidad > 0 ? acento : 'rgba(255,255,255,0.1)',
                opacity: intensidad > 0 ? opacity : 1,
              }
            ]} 
          />
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    justifyContent: 'space-between',
    marginTop: 12,
  },
  celda: {
    width: '12%', // approx 7 columns
    aspectRatio: 1,
    borderRadius: 6,
  }
});
