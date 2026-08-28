import React from 'react';
import { View, StyleSheet } from 'react-native';
import Reanimated, { FadeInDown } from 'react-native-reanimated';
import Svg, { Path, Circle, Line } from 'react-native-svg';
import { Gauge, LucideIcon } from 'lucide-react-native';
import { Texto, RecuadroGlass, colores } from '../../../../../diseno';
import { ContentPack } from '../arquitectura/tipos_sdui';

function conAlpha(color: string, alpha: string) { return `${color}${alpha}`; }

interface Props {
  pack: ContentPack;
  data: { score: number }; // 0 to 100
  acento: string;
}

export function MotorVelocimetro({ pack, data, acento }: Props) {
  const score = Math.min(Math.max(data.score, 0), 100);
  const cx = 100; const cy = 90; const r = 80;
  
  // Perímetro de media circunferencia
  const C = Math.PI * r; 
  const offset = C - (score / 100) * C;
  
  // Aguja math (180 deg = 0 score, 0 deg = 100 score)
  const angleDeg = 180 - (score / 100) * 180;
  const angleRad = (angleDeg * Math.PI) / 180;
  const agujaX = cx + (r - 15) * Math.cos(angleRad);
  const agujaY = cy - (r - 15) * Math.sin(angleRad);

  return (
    <View style={styles.raiz}>
      <Reanimated.View entering={FadeInDown.duration(400)}>
        <RecuadroGlass blur intensity={40} style={[styles.panel, { borderColor: conAlpha(acento, '20') }]}>
          <View style={styles.cabeceraPanel}>
            <View>
              <Texto style={styles.titulo}>{pack.title}</Texto>
              <Texto style={styles.subtitulo}>{pack.subtitle}</Texto>
            </View>
            <Gauge color={acento} size={18} />
          </View>

          <View style={{ alignItems: 'center', marginTop: 24, height: 110 }}>
            <Svg width="200" height="100" viewBox="0 0 200 100">
              {/* Fondo del Gauge */}
              <Path 
                d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`} 
                fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="12" strokeLinecap="round" 
              />
              {/* Relleno del Gauge */}
              <Path 
                d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`} 
                fill="none" stroke={acento} strokeWidth="12" strokeLinecap="round"
                strokeDasharray={C} strokeDashoffset={offset}
              />
              {/* Aguja base */}
              <Circle cx={cx} cy={cy} r="6" fill="#FFF" />
              {/* Aguja punta */}
              <Line x1={cx} y1={cy} x2={agujaX} y2={agujaY} stroke="#FFF" strokeWidth="3" strokeLinecap="round" />
            </Svg>
            
            <View style={{ position: 'absolute', bottom: -10, alignItems: 'center' }}>
              <Texto style={styles.textoValorGigante}>{score}</Texto>
              <Texto style={styles.textoEtiqueta}>{pack.unit}</Texto>
            </View>
          </View>
          <Texto style={[styles.microcopy, { color: acento, textAlign: 'center', marginTop: 12 }]}>{pack.microcopy.onTrack}</Texto>
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
  textoValorGigante: { fontFamily: 'MontserratAlternates-Bold', fontSize: 32, color: colores.texto },
  textoEtiqueta: { fontFamily: 'MontserratAlternates-SemiBold', fontSize: 12, color: colores.textoSecundario },
  microcopy: { fontFamily: 'MontserratAlternates-Medium', fontSize: 11 }
});
