import React from 'react';
import { View, StyleSheet } from 'react-native';
import Reanimated, { FadeInDown } from 'react-native-reanimated';
import Svg, { Circle, Line, Path } from 'react-native-svg';
import { Clock, LucideIcon } from 'lucide-react-native';
import { Texto, RecuadroGlass, colores } from '../../../../../diseno';
import { ContentPack } from '../arquitectura/tipos_sdui';

function conAlpha(color: string, alpha: string) { return `${color}${alpha}`; }

interface Props {
  pack: ContentPack;
  data: { horaPico: number }; // 0 to 23
  acento: string;
}

export function MotorRelojRadar({ pack, data, acento }: Props) {
  const angulo = (data.horaPico / 24) * 360 - 90; // Convert 24h to 360 deg, start at top (-90)
  const rad = (angulo * Math.PI) / 180;
  
  const cx = 50; const cy = 50; const r = 35;
  const x = cx + r * Math.cos(rad);
  const y = cy + r * Math.sin(rad);

  return (
    <View style={styles.raiz}>
      <Reanimated.View entering={FadeInDown.duration(400)}>
        <RecuadroGlass blur intensity={40} style={[styles.panel, { borderColor: conAlpha(acento, '20') }]}>
          <View style={styles.cabeceraPanel}>
            <View>
              <Texto style={styles.titulo}>{pack.title}</Texto>
              <Texto style={styles.subtitulo}>{pack.subtitle}</Texto>
            </View>
            <Clock color={acento} size={18} />
          </View>

          <View style={styles.contenedorCentral}>
            <View style={{ width: 100, height: 100, position: 'relative' }}>
              <Svg width="100%" height="100%" viewBox="0 0 100 100">
                <Circle cx="50" cy="50" r="40" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="4" />
                <Circle cx="50" cy="50" r="2" fill="rgba(255,255,255,0.5)" />
                {/* Agujas fijas (12, 6, 18, 0) */}
                <Line x1="50" y1="5" x2="50" y2="15" stroke="rgba(255,255,255,0.2)" strokeWidth="2" strokeLinecap="round" />
                <Line x1="50" y1="95" x2="50" y2="85" stroke="rgba(255,255,255,0.2)" strokeWidth="2" strokeLinecap="round" />
                <Line x1="5" y1="50" x2="15" y2="50" stroke="rgba(255,255,255,0.2)" strokeWidth="2" strokeLinecap="round" />
                <Line x1="95" y1="50" x2="85" y2="50" stroke="rgba(255,255,255,0.2)" strokeWidth="2" strokeLinecap="round" />
                
                {/* Zona de Radar (Slice) */}
                <Path d={`M 50 50 L ${x} ${y} A 35 35 0 0 1 ${cx + r*Math.cos(rad+0.5)} ${cy + r*Math.sin(rad+0.5)} Z`} fill={conAlpha(acento, '40')} />
                
                {/* Aguja de Pico */}
                <Line x1="50" y1="50" x2={x} y2={y} stroke={acento} strokeWidth="3" strokeLinecap="round" />
                <Circle cx={x} cy={y} r="4" fill="#FFFFFF" stroke={acento} strokeWidth="2" />
              </Svg>
            </View>
            
            <View style={styles.infoLado}>
              <Texto style={styles.textoEtiqueta}>{pack.value_label}</Texto>
              <Texto style={styles.textoValorGigante}>{data.horaPico}:00</Texto>
              <Texto style={styles.textoMeta}>Horario {pack.unit}</Texto>
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
  infoLado: { flex: 1, justifyContent: 'center' },
  textoEtiqueta: { fontFamily: 'MontserratAlternates-Medium', fontSize: 11, color: colores.textoSecundario },
  textoValorGigante: { fontFamily: 'MontserratAlternates-Bold', fontSize: 32, lineHeight: 38, color: colores.texto, marginVertical: 2 },
  textoMeta: { fontFamily: 'MontserratAlternates-SemiBold', fontSize: 12, color: colores.textoSecundario },
  microcopy: { fontFamily: 'MontserratAlternates-Medium', fontSize: 10, marginTop: 12 }
});
