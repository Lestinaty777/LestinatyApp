import React from 'react';
import { View, StyleSheet } from 'react-native';
import Reanimated, { FadeInDown } from 'react-native-reanimated';
import Svg, { Path, Circle, Defs, LinearGradient, Stop } from 'react-native-svg';
import { Activity, Scale, TrendingDown, TrendingUp, LucideIcon } from 'lucide-react-native';
import { Texto, RecuadroGlass, colores } from '../../../../../diseno';
import { ContentPack } from '../arquitectura/tipos_sdui';

function conAlpha(color: string, alpha: string) { return `${color}${alpha}`; }

const IconMap: Record<string, LucideIcon> = {
  'activity': Activity,
  'scale': Scale,
  'trending-down': TrendingDown,
  'trending-up': TrendingUp
};

interface Props {
  pack: ContentPack;
  data: { historico: number[], inicio: number, actual: number, meta: number }; 
  acento: string;
}

export function MotorLineaTendencia({ pack, data, acento }: Props) {
  const Icon = IconMap[pack.icon] || Activity;
  const { historico, inicio, actual, meta } = data;
  
  const widthSVG = 280;
  const heightSVG = 100;
  const minVal = Math.min(...historico, meta) * 0.95;
  const maxVal = Math.max(...historico, meta) * 1.05;
  
  const rango = maxVal - minVal || 1; // Evitar division por cero

  const pathLinea = historico.map((val, i) => {
    const x = (i / (historico.length - 1)) * widthSVG;
    const y = heightSVG - ((val - minVal) / rango) * heightSVG;
    return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
  }).join(' ');

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
          
          <View style={styles.resumenGrid}>
            <View>
              <Texto style={styles.textoEtiqueta}>Inicio</Texto>
              <Texto style={styles.textoValor}>{inicio.toFixed(1)} {pack.unit}</Texto>
            </View>
            <View style={{ alignItems: 'center' }}>
              <Texto style={styles.textoEtiqueta}>Actual</Texto>
              <Texto style={[styles.textoValor, { color: acento, fontSize: 24 }]}>{actual.toFixed(1)} {pack.unit}</Texto>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Texto style={styles.textoEtiqueta}>Meta</Texto>
              <Texto style={styles.textoValor}>{meta.toFixed(1)} {pack.unit}</Texto>
            </View>
          </View>

          <View style={{ height: 100, marginTop: 16 }}>
            <Svg width="100%" height="100%" viewBox={`0 0 ${widthSVG} ${heightSVG}`} preserveAspectRatio="none">
              <Defs>
                <LinearGradient id="gradLinea" x1="0%" y1="0%" x2="0%" y2="100%">
                  <Stop offset="0%" stopColor={acento} stopOpacity="0.4" />
                  <Stop offset="100%" stopColor={acento} stopOpacity="0" />
                </LinearGradient>
              </Defs>
              <Path d={`${pathLinea} L ${widthSVG} ${heightSVG} L 0 ${heightSVG} Z`} fill="url(#gradLinea)" />
              <Path d={pathLinea} fill="none" stroke={acento} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
              {historico.map((val, i) => {
                const x = (i / (historico.length - 1)) * widthSVG;
                const y = heightSVG - ((val - minVal) / rango) * heightSVG;
                return <Circle key={i} cx={x} cy={y} r="4" fill={acento} stroke={colores.fondo} strokeWidth="2" />;
              })}
            </Svg>
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
  resumenGrid: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 24, paddingHorizontal: 8 },
  textoEtiqueta: { fontFamily: 'MontserratAlternates-Medium', fontSize: 11, color: colores.textoSecundario, marginBottom: 4 },
  textoValor: { fontFamily: 'MontserratAlternates-Bold', fontSize: 16, color: colores.texto }
});
