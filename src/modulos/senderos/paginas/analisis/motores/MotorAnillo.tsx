import React from 'react';
import { View, StyleSheet } from 'react-native';
import Reanimated, { FadeInDown } from 'react-native-reanimated';
import Svg, { Circle } from 'react-native-svg';
import { Target } from 'lucide-react-native';
import { Texto, RecuadroGlass, colores } from '../../../../../diseno';
import { ContentPack } from '../arquitectura/tipos_sdui';

function conAlpha(color: string, alpha: string) { return `${color}${alpha}`; }

interface Props {
  pack: ContentPack;
  data: { actual: number, meta: number }; 
  acento: string;
}

export function MotorAnillo({ pack, data, acento }: Props) {
  const progreso = Math.min((data.actual / data.meta) * 100, 100);
  const R = 45;
  const C = 2 * Math.PI * R;
  const offset = C - (progreso / 100) * C;

  return (
    <View style={styles.raiz}>
      <Reanimated.View entering={FadeInDown.duration(400)}>
        <RecuadroGlass blur intensity={40} style={[styles.panel, { borderColor: conAlpha(acento, '20') }]}>
          <View style={styles.cabeceraPanel}>
            <View>
              <Texto style={styles.titulo}>{pack.title}</Texto>
              <Texto style={styles.subtitulo}>{pack.subtitle}</Texto>
            </View>
            <Target color={acento} size={18} />
          </View>

          <View style={styles.contenedorCentral}>
            <View style={{ width: 120, height: 120, position: 'relative', alignItems: 'center', justifyContent: 'center' }}>
              <Svg width="100%" height="100%" viewBox="0 0 100 100" style={{ transform: [{ rotate: '-90deg' }] }}>
                <Circle cx="50" cy="50" r={R} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="8" />
                <Circle 
                  cx="50" cy="50" r={R} fill="none" stroke={acento} strokeWidth="8" strokeLinecap="round"
                  strokeDasharray={C} strokeDashoffset={offset} 
                />
              </Svg>
              <View style={styles.datosCentro}>
                <Texto style={styles.textoPorcentaje}>{Math.round(progreso)}%</Texto>
              </View>
            </View>
            
            <View style={styles.infoLado}>
              <Texto style={styles.textoEtiqueta}>{pack.value_label}</Texto>
              <Texto style={styles.textoValorGigante}>{data.actual}</Texto>
              <Texto style={styles.textoMeta}>de {data.meta} {pack.unit}</Texto>
              <Texto style={[styles.microcopy, { color: acento }]}>{pack.microcopy.onTrack}</Texto>
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
  contenedorCentral: { flexDirection: 'row', alignItems: 'center', marginTop: 16, gap: 24 },
  datosCentro: { position: 'absolute', alignItems: 'center', justifyContent: 'center' },
  textoPorcentaje: { fontFamily: 'MontserratAlternates-Bold', fontSize: 24, lineHeight: 29, color: colores.texto },
  infoLado: { flex: 1, justifyContent: 'center' },
  textoEtiqueta: { fontFamily: 'MontserratAlternates-Medium', fontSize: 11, color: colores.textoSecundario },
  textoValorGigante: { fontFamily: 'MontserratAlternates-Bold', fontSize: 32, lineHeight: 38, color: colores.texto, marginVertical: 2 },
  textoMeta: { fontFamily: 'MontserratAlternates-SemiBold', fontSize: 12, color: colores.textoSecundario },
  microcopy: { fontFamily: 'MontserratAlternates-Medium', fontSize: 10, marginTop: 12 }
});
