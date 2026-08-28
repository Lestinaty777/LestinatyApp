import React from 'react';
import { View, StyleSheet } from 'react-native';
import Reanimated, { FadeInDown } from 'react-native-reanimated';
import Svg, { Polygon, Line, Circle, Text as SvgText } from 'react-native-svg';
import { Network, LucideIcon } from 'lucide-react-native';
import { Texto, RecuadroGlass, colores } from '../../../../../diseno';
import { ContentPack } from '../arquitectura/tipos_sdui';

function conAlpha(color: string, alpha: string) { return `${color}${alpha}`; }

interface Props {
  pack: ContentPack;
  data: { categorias: { etiqueta: string; valor: number }[] }; // max 100
  acento: string;
}

export function MotorArana({ pack, data, acento }: Props) {
  const cx = 100; const cy = 100; const maxR = 70;
  const sides = data.categorias.length || 5;

  // Calculador de coordenadas
  const getPoint = (r: number, angleDeg: number) => {
    const rad = (angleDeg - 90) * (Math.PI / 180);
    return `${cx + r * Math.cos(rad)},${cy + r * Math.sin(rad)}`;
  };

  const polyBackground = data.categorias.map((_, i) => getPoint(maxR, (360 / sides) * i)).join(' ');
  const polyData = data.categorias.map((c, i) => getPoint(maxR * (c.valor / 100), (360 / sides) * i)).join(' ');

  return (
    <View style={styles.raiz}>
      <Reanimated.View entering={FadeInDown.duration(400)}>
        <RecuadroGlass blur intensity={40} style={[styles.panel, { borderColor: conAlpha(acento, '20') }]}>
          <View style={styles.cabeceraPanel}>
            <View>
              <Texto style={styles.titulo}>{pack.title}</Texto>
              <Texto style={styles.subtitulo}>{pack.subtitle}</Texto>
            </View>
            <Network color={acento} size={18} />
          </View>

          <View style={{ alignItems: 'center', marginTop: 16, height: 200 }}>
            <Svg width="220" height="220" viewBox="0 0 200 200">
              {/* Ejes desde el centro */}
              {data.categorias.map((_, i) => {
                const pt = getPoint(maxR, (360 / sides) * i).split(',');
                return <Line key={i} x1={cx} y1={cy} x2={pt[0]} y2={pt[1]} stroke="rgba(255,255,255,0.1)" strokeWidth="1" />;
              })}
              
              {/* Web Background */}
              <Polygon points={polyBackground} fill="rgba(255,255,255,0.02)" stroke="rgba(255,255,255,0.1)" strokeWidth="1" />
              <Polygon points={data.categorias.map((_, i) => getPoint(maxR*0.66, (360/sides)*i)).join(' ')} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
              <Polygon points={data.categorias.map((_, i) => getPoint(maxR*0.33, (360/sides)*i)).join(' ')} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="1" />

              {/* Data Web */}
              <Polygon points={polyData} fill={conAlpha(acento, '30')} stroke={acento} strokeWidth="2" strokeLinejoin="round" />
              
              {/* Puntos Data */}
              {data.categorias.map((c, i) => {
                const pt = getPoint(maxR * (c.valor / 100), (360 / sides) * i).split(',');
                return <Circle key={`c${i}`} cx={pt[0]} cy={pt[1]} r="3" fill="#FFF" />;
              })}

              {/* Etiquetas (Aproximadas) */}
              {data.categorias.map((c, i) => {
                const angle = (360 / sides) * i;
                const pt = getPoint(maxR + 15, angle).split(',');
                return (
                  <SvgText key={`t${i}`} x={pt[0]} y={pt[1]} fill={colores.textoSecundario} fontSize="8" fontWeight="bold" textAnchor="middle" alignmentBaseline="middle">
                    {c.etiqueta}
                  </SvgText>
                );
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
  subtitulo: { fontFamily: 'MontserratAlternates-Medium', fontSize: 11, color: colores.textoSecundario, marginTop: 2 }
});
