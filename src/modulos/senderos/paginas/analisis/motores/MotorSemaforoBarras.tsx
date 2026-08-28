import React from 'react';
import { View, StyleSheet } from 'react-native';
import Reanimated, { FadeInDown } from 'react-native-reanimated';
import { Moon, AlarmClock, Battery, LucideIcon } from 'lucide-react-native';
import { Texto, RecuadroGlass, colores } from '../../../../../diseno';
import { ContentPack } from '../arquitectura/tipos_sdui';

function conAlpha(color: string, alpha: string) { return `${color}${alpha}`; }

const IconMap: Record<string, LucideIcon> = {
  'moon': Moon,
  'alarm-clock': AlarmClock,
  'battery': Battery
};

interface Props {
  pack: ContentPack;
  data: { semana: number[] }; 
  acento: string;
}

export function MotorSemaforoBarras({ pack, data, acento }: Props) {
  const Icon = IconMap[pack.icon] || AlarmClock;
  const dias = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];
  const promedio = (data.semana.reduce((a, b) => a + b, 0) / 7).toFixed(1);

  // Umbrales genericos
  const thresholdGreen = 7;
  const thresholdYellow = 5;

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

          <View style={styles.graficaSemana}>
            {data.semana.map((h, i) => {
              const hPercent = Math.min((h / 10) * 100, 100); 
              let colorBarra = acento; 
              if (h < thresholdYellow) colorBarra = '#ef4444'; 
              else if (h < thresholdGreen) colorBarra = '#fbbf24'; 

              return (
                <View key={i} style={styles.columnaSemana}>
                  <Texto style={[styles.textoMini, { color: colorBarra }]}>{h}{pack.unit}</Texto>
                  <View style={styles.barraFondoSemana}>
                    <View style={[styles.barraRellenoSemana, { height: `${hPercent}%`, backgroundColor: colorBarra }]} />
                  </View>
                  <Texto style={styles.diaLetra}>{dias[i]}</Texto>
                </View>
              );
            })}
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
  graficaSemana: { flexDirection: 'row', justifyContent: 'space-between', height: 140, marginTop: 24, paddingHorizontal: 4 },
  columnaSemana: { alignItems: 'center', justifyContent: 'flex-end', height: '100%', gap: 8 },
  barraFondoSemana: { width: 18, height: 100, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 4, overflow: 'hidden', justifyContent: 'flex-end' },
  barraRellenoSemana: { width: '100%', borderRadius: 4 },
  textoMini: { fontFamily: 'MontserratAlternates-Bold', fontSize: 11 },
  diaLetra: { fontFamily: 'MontserratAlternates-SemiBold', fontSize: 12, color: colores.textoSecundario }
});
