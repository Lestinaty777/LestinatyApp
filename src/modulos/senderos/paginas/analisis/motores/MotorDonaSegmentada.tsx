import React from 'react';
import { View, StyleSheet } from 'react-native';
import Reanimated, { FadeInDown } from 'react-native-reanimated';
import Svg, { Circle } from 'react-native-svg';
import { PieChart, LucideIcon } from 'lucide-react-native';
import { Texto, RecuadroGlass, colores } from '../../../../../diseno';
import { ContentPack } from '../arquitectura/tipos_sdui';

function conAlpha(color: string, alpha: string) { return `${color}${alpha}`; }

interface Segmento { etiqueta: string; valor: number; color: string; }

interface Props {
  pack: ContentPack;
  data: { total: number; segmentos: Segmento[] }; 
  acento: string; // The fallback accent
}

export function MotorDonaSegmentada({ pack, data, acento }: Props) {
  const Icon = PieChart;
  
  const R = 40;
  const C = 2 * Math.PI * R;
  let acumulado = 0;

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

          <View style={styles.contenedorCentral}>
            <View style={{ width: 100, height: 100, alignItems: 'center', justifyContent: 'center' }}>
              <Svg width="100%" height="100%" viewBox="0 0 100 100">
                <Circle cx="50" cy="50" r={R} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="12" />
                {data.segmentos.map((seg, i) => {
                  const percent = seg.valor / Math.max(data.total, 1);
                  const strokeDasharray = `${percent * C} ${C}`;
                  const rotacion = -90 + (acumulado / Math.max(data.total, 1)) * 360;
                  acumulado += seg.valor;
                  
                  return (
                    <Circle 
                      key={i} cx="50" cy="50" r={R} fill="none" 
                      stroke={seg.color} strokeWidth="12" 
                      strokeDasharray={strokeDasharray} 
                      transform={`rotate(${rotacion} 50 50)`} 
                    />
                  );
                })}
              </Svg>
            </View>

            <View style={styles.infoLado}>
              {data.segmentos.map((seg, i) => (
                <View key={i} style={styles.filaLeyenda}>
                  <View style={[styles.puntoColor, { backgroundColor: seg.color }]} />
                  <Texto style={styles.etiquetaLeyenda}>{seg.etiqueta}</Texto>
                  <Texto style={styles.valorLeyenda}>{seg.valor} {pack.unit}</Texto>
                </View>
              ))}
            </View>
          </View>
          <Texto style={[styles.microcopy, { color: acento, marginTop: 16 }]}>{pack.microcopy.onTrack}</Texto>
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
  contenedorCentral: { flexDirection: 'row', alignItems: 'center', marginTop: 16, gap: 24 },
  infoLado: { flex: 1, justifyContent: 'center', gap: 12 },
  filaLeyenda: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  puntoColor: { width: 10, height: 10, borderRadius: 5, marginRight: 8 },
  etiquetaLeyenda: { fontFamily: 'MontserratAlternates-Medium', fontSize: 11, color: colores.textoSecundario, flex: 1 },
  valorLeyenda: { fontFamily: 'MontserratAlternates-Bold', fontSize: 12, color: colores.texto },
  microcopy: { fontFamily: 'MontserratAlternates-Medium', fontSize: 11, textAlign: 'center' }
});
