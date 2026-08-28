import React from 'react';
import { View, StyleSheet } from 'react-native';
import Reanimated, { FadeInDown } from 'react-native-reanimated';
import { BarChart2, LucideIcon } from 'lucide-react-native';
import { Texto, RecuadroGlass, colores } from '../../../../../diseno';
import { ContentPack } from '../arquitectura/tipos_sdui';

function conAlpha(color: string, alpha: string) { return `${color}${alpha}`; }

interface Props {
  pack: ContentPack;
  data: { barras: { etiqueta: string; valor: number }[] }; 
  acento: string;
}

export function MotorBarras({ pack, data, acento }: Props) {
  const Icon = BarChart2; // default icon if none matching
  
  const maxVal = Math.max(...data.barras.map(b => b.valor), 1);

  return (
    <View style={styles.raiz}>
      <Reanimated.View entering={FadeInDown.duration(400)}>
        <RecuadroGlass blur intensity={40} style={[styles.panel, { borderColor: conAlpha(acento, '20') }]}>
          <View style={styles.cabeceraPanel}>
            <View>
              <Texto style={styles.titulo}>{pack.title}</Texto>
              <Texto style={styles.subtitulo}>{pack.subtitle}</Texto>
            </View>
            <Icon color={acento} size={18} />
          </View>

          <View style={styles.graficaContenedor}>
            {data.barras.map((b, i) => {
              const hPercent = (b.valor / maxVal) * 100;
              return (
                <View key={i} style={styles.columna}>
                  <Texto style={styles.textoMini}>{b.valor}{pack.unit}</Texto>
                  <View style={styles.barraFondo}>
                    <View style={[styles.barraRelleno, { height: `${hPercent}%`, backgroundColor: acento }]} />
                  </View>
                  <Texto style={styles.etiquetaTexto} numberOfLines={1}>{b.etiqueta}</Texto>
                </View>
              );
            })}
          </View>
          <Texto style={[styles.microcopy, { color: acento, textAlign: 'center', marginTop: 16 }]}>
            {pack.microcopy.onTrack}
          </Texto>
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
  graficaContenedor: { flexDirection: 'row', justifyContent: 'space-between', height: 140, marginTop: 24, paddingHorizontal: 4 },
  columna: { flex: 1, alignItems: 'center', justifyContent: 'flex-end', height: '100%', gap: 8 },
  barraFondo: { width: 14, height: 100, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 4, overflow: 'hidden', justifyContent: 'flex-end' },
  barraRelleno: { width: '100%', borderRadius: 4 },
  textoMini: { fontFamily: 'MontserratAlternates-SemiBold', fontSize: 9, color: colores.textoSecundario },
  etiquetaTexto: { fontFamily: 'MontserratAlternates-SemiBold', fontSize: 10, color: colores.textoSecundario },
  microcopy: { fontFamily: 'MontserratAlternates-Medium', fontSize: 11 }
});
