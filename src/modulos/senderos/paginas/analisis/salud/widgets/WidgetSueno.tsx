import React from 'react';
import { View, StyleSheet } from 'react-native';
import Reanimated, { FadeInDown } from 'react-native-reanimated';
import { Moon, AlarmClock } from 'lucide-react-native';
import { Texto, RecuadroGlass, colores } from '../../../../../../diseno';

function conAlpha(color: string, alpha: string) {
  return `${color}${alpha}`;
}

export function WidgetSueno({ acento }: { acento: string }) {
  const horasSemana = [8.2, 7.5, 6.0, 4.5, 7.0, 8.5, 5.5];
  const dias = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];
  
  const promedio = (horasSemana.reduce((a, b) => a + b, 0) / 7).toFixed(1);

  return (
    <View style={styles.raiz}>
      <Reanimated.View entering={FadeInDown.duration(400)}>
        <RecuadroGlass blur intensity={40} style={[styles.panel, { borderColor: conAlpha(acento, '20') }]}>
          <View style={styles.cabeceraPanel}>
            <View>
              <Texto style={styles.titulo}>Promedio de Descanso</Texto>
              <Texto style={styles.subtitulo}>Últimos 7 días</Texto>
            </View>
            <Moon color={acento} size={18} />
          </View>

          <View style={{ marginTop: 24, paddingHorizontal: 12 }}>
            <View style={{ flexDirection: 'row', alignItems: 'baseline' }}>
              <Texto style={styles.numeroGigante}>{promedio}</Texto>
              <Texto style={styles.etiquetaHoras}> hrs / noche</Texto>
            </View>
            <Texto style={[styles.textoEtiqueta, { color: acento, marginTop: 4 }]}>Nivel Óptimo de Recuperación</Texto>
          </View>
        </RecuadroGlass>
      </Reanimated.View>

      <Reanimated.View entering={FadeInDown.duration(400).delay(100)}>
        <RecuadroGlass blur intensity={40} style={[styles.panel, { borderColor: conAlpha(acento, '20') }]}>
          <View style={styles.cabeceraPanel}>
            <View>
              <Texto style={styles.titulo}>El Semáforo del Sueño</Texto>
              <Texto style={styles.subtitulo}>Calidad de descanso semanal</Texto>
            </View>
            <AlarmClock color={acento} size={18} />
          </View>

          <View style={styles.graficaSemana}>
            {horasSemana.map((h, i) => {
              const hPercent = Math.min((h / 10) * 100, 100); 
              let colorBarra = acento; // default green/accent
              if (h < 5) colorBarra = '#ef4444'; // Red
              else if (h < 7) colorBarra = '#fbbf24'; // Yellow

              return (
                <View key={i} style={styles.columnaSemana}>
                  <Texto style={[styles.textoMini, { color: colorBarra }]}>{h}h</Texto>
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
  
  numeroGigante: { fontFamily: 'MontserratAlternates-Bold', fontSize: 42, color: colores.texto },
  etiquetaHoras: { fontFamily: 'MontserratAlternates-Medium', fontSize: 18, color: colores.textoSecundario },
  textoEtiqueta: { fontFamily: 'MontserratAlternates-SemiBold', fontSize: 12 },
  
  graficaSemana: { flexDirection: 'row', justifyContent: 'space-between', height: 140, marginTop: 24, paddingHorizontal: 4 },
  columnaSemana: { alignItems: 'center', justifyContent: 'flex-end', height: '100%', gap: 8 },
  barraFondoSemana: { width: 18, height: 100, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 4, overflow: 'hidden', justifyContent: 'flex-end' },
  barraRellenoSemana: { width: '100%', borderRadius: 4 },
  textoMini: { fontFamily: 'MontserratAlternates-Bold', fontSize: 11 },
  diaLetra: { fontFamily: 'MontserratAlternates-SemiBold', fontSize: 12, color: colores.textoSecundario }
});
