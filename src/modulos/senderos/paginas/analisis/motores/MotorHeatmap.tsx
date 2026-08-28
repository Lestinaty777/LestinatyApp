import React from 'react';
import { View, StyleSheet } from 'react-native';
import Reanimated, { FadeInDown } from 'react-native-reanimated';
import { Grid, LucideIcon } from 'lucide-react-native';
import { Texto, RecuadroGlass, colores } from '../../../../../diseno';
import { ContentPack } from '../arquitectura/tipos_sdui';

function conAlpha(color: string, alpha: string) { return `${color}${alpha}`; }

interface Props {
  pack: ContentPack;
  data: { matriz: number[] }; // Array of 28 intensity values (0-4)
  acento: string;
}

export function MotorHeatmap({ pack, data, acento }: Props) {
  const diasFila = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];

  return (
    <View style={styles.raiz}>
      <Reanimated.View entering={FadeInDown.duration(400)}>
        <RecuadroGlass blur intensity={40} style={[styles.panel, { borderColor: conAlpha(acento, '20') }]}>
          <View style={styles.cabeceraPanel}>
            <View>
              <Texto style={styles.titulo}>{pack.title}</Texto>
              <Texto style={styles.subtitulo}>{pack.subtitle}</Texto>
            </View>
            <Grid color={acento} size={18} />
          </View>

          <View style={{ marginTop: 24 }}>
            <View style={styles.diasFila}>
              {diasFila.map((d, i) => <Texto key={i} style={styles.diaTexto}>{d}</Texto>)}
            </View>
            <View style={styles.gridMapa}>
              {data.matriz.map((val, i) => {
                let opacity = '05';
                if (val === 1) opacity = '40';
                if (val === 2) opacity = '70';
                if (val >= 3) opacity = 'FF';
                
                return (
                  <View key={i} style={[
                    styles.cuadroCalor, 
                    { 
                      backgroundColor: val === 0 ? 'rgba(255,255,255,0.02)' : conAlpha(acento, opacity),
                      borderColor: val === 0 ? conAlpha(acento, '15') : 'transparent',
                      borderWidth: val === 0 ? 1 : 0
                    }
                  ]} />
                );
              })}
            </View>
            <View style={styles.leyendaHeatmap}>
              <Texto style={styles.textoMicro}>Menos</Texto>
              <View style={{ flexDirection: 'row', gap: 4 }}>
                <View style={[styles.leyendaPunto, { backgroundColor: 'rgba(255,255,255,0.02)', borderWidth: 1, borderColor: conAlpha(acento, '15') }]} />
                <View style={[styles.leyendaPunto, { backgroundColor: conAlpha(acento, '40') }]} />
                <View style={[styles.leyendaPunto, { backgroundColor: conAlpha(acento, '70') }]} />
                <View style={[styles.leyendaPunto, { backgroundColor: acento }]} />
              </View>
              <Texto style={styles.textoMicro}>Más</Texto>
            </View>
          </View>
        </RecuadroGlass>
      </Reanimated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  raiz: { gap: 12 },
  panel: { padding: 18, borderRadius: 24, borderWidth: 1, marginTop: 12, overflow: 'hidden' },
  cabeceraPanel: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  titulo: { fontFamily: 'MontserratAlternates-Bold', fontSize: 16, color: colores.texto },
  subtitulo: { fontFamily: 'MontserratAlternates-Medium', fontSize: 11, color: colores.textoSecundario, marginTop: 2 },
  diasFila: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8, paddingHorizontal: 4 },
  diaTexto: { fontFamily: 'MontserratAlternates-SemiBold', fontSize: 10, color: colores.textoSecundario, width: '12%', textAlign: 'center' },
  gridMapa: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, justifyContent: 'space-between', width: '100%' },
  cuadroCalor: { width: '12%', aspectRatio: 1, borderRadius: 6 },
  leyendaHeatmap: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: 8, marginTop: 16 },
  leyendaPunto: { width: 10, height: 10, borderRadius: 3 },
  textoMicro: { fontFamily: 'MontserratAlternates-Medium', fontSize: 9, color: colores.textoSecundario }
});
