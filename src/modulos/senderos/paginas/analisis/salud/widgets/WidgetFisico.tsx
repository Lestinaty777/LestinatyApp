import React from 'react';
import { View, StyleSheet } from 'react-native';
import Reanimated, { FadeInDown } from 'react-native-reanimated';
import Svg, { Path, Circle, Defs, LinearGradient, Stop } from 'react-native-svg';
import { Scale, CalendarCheck } from 'lucide-react-native';
import { Texto, RecuadroGlass, colores } from '../../../../../../diseno';

function conAlpha(color: string, alpha: string) {
  return `${color}${alpha}`;
}

export function WidgetFisico({ acento }: { acento: string }) {
  // Datos simulados de la báscula (Peso bajando de 82kg a 78kg)
  const puntosPeso = [82.5, 81.8, 81.2, 80.5, 79.8, 79.0, 78.2];
  const widthSVG = 280;
  const heightSVG = 100;
  
  const minPeso = 75;
  const maxPeso = 85;
  
  const pathPeso = puntosPeso.map((val, i) => {
    const x = (i / 6) * widthSVG;
    const y = heightSVG - ((val - minPeso) / (maxPeso - minPeso)) * heightSVG;
    return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
  }).join(' ');

  // Datos simulados del calendario de entrenamiento (7 días)
  const dias = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];
  const entrenamientos = [true, true, false, true, true, false, true];

  return (
    <View style={styles.raiz}>
      
      {/* Módulo 1: La Báscula */}
      <Reanimated.View entering={FadeInDown.duration(400)}>
        <RecuadroGlass blur intensity={40} style={[styles.panel, { borderColor: conAlpha(acento, '20') }]}>
          <View style={styles.cabeceraPanel}>
            <View>
              <Texto style={styles.titulo}>Tendencia de Peso</Texto>
              <Texto style={styles.subtitulo}>Últimas 7 semanas</Texto>
            </View>
            <Scale color={acento} size={18} />
          </View>
          
          <View style={styles.resumenBascula}>
            <View>
              <Texto style={styles.textoEtiqueta}>Inicial</Texto>
              <Texto style={styles.textoValor}>82.5 kg</Texto>
            </View>
            <View style={{ alignItems: 'center' }}>
              <Texto style={styles.textoEtiqueta}>Actual</Texto>
              <Texto style={[styles.textoValor, { color: acento, fontSize: 24 }]}>78.2 kg</Texto>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Texto style={styles.textoEtiqueta}>Meta</Texto>
              <Texto style={styles.textoValor}>75.0 kg</Texto>
            </View>
          </View>

          <View style={{ height: 100, marginTop: 16 }}>
            <Svg width="100%" height="100%" viewBox={`0 0 ${widthSVG} ${heightSVG}`} preserveAspectRatio="none">
              <Defs>
                <LinearGradient id="gradPeso" x1="0%" y1="0%" x2="0%" y2="100%">
                  <Stop offset="0%" stopColor={acento} stopOpacity="0.4" />
                  <Stop offset="100%" stopColor={acento} stopOpacity="0" />
                </LinearGradient>
              </Defs>
              <Path d={`${pathPeso} L ${widthSVG} ${heightSVG} L 0 ${heightSVG} Z`} fill="url(#gradPeso)" />
              <Path d={pathPeso} fill="none" stroke={acento} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
              {/* Puntos en la linea */}
              {puntosPeso.map((val, i) => {
                const x = (i / 6) * widthSVG;
                const y = heightSVG - ((val - minPeso) / (maxPeso - minPeso)) * heightSVG;
                return <Circle key={i} cx={x} cy={y} r="4" fill={acento} stroke={colores.fondo} strokeWidth="2" />;
              })}
            </Svg>
          </View>
        </RecuadroGlass>
      </Reanimated.View>

      {/* Módulo 2: Calendario de Entrenamiento */}
      <Reanimated.View entering={FadeInDown.duration(400).delay(100)}>
        <RecuadroGlass blur intensity={40} style={[styles.panel, { borderColor: conAlpha(acento, '20') }]}>
          <View style={styles.cabeceraPanel}>
            <View>
              <Texto style={styles.titulo}>Consistencia Física</Texto>
              <Texto style={styles.subtitulo}>Días de entrenamiento esta semana</Texto>
            </View>
            <CalendarCheck color={acento} size={18} />
          </View>

          <View style={styles.gridSemana}>
            {dias.map((dia, i) => {
              const completado = entrenamientos[i];
              return (
                <View key={i} style={styles.diaColumna}>
                  <Texto style={styles.diaLetra}>{dia}</Texto>
                  <View style={[
                    styles.circuloDia, 
                    { 
                      backgroundColor: completado ? acento : 'rgba(255,255,255,0.03)',
                      borderColor: completado ? acento : conAlpha(colores.textoSecundario, '30'),
                      borderWidth: completado ? 0 : 1
                    }
                  ]}>
                    {completado && <View style={styles.puntoInterior} />}
                  </View>
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
  
  resumenBascula: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 24, paddingHorizontal: 8 },
  textoEtiqueta: { fontFamily: 'MontserratAlternates-Medium', fontSize: 11, color: colores.textoSecundario, marginBottom: 4 },
  textoValor: { fontFamily: 'MontserratAlternates-Bold', fontSize: 16, color: colores.texto },
  
  gridSemana: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 24, paddingHorizontal: 8 },
  diaColumna: { alignItems: 'center', gap: 8 },
  diaLetra: { fontFamily: 'MontserratAlternates-SemiBold', fontSize: 12, color: colores.textoSecundario },
  circuloDia: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  puntoInterior: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#FFFFFF' }
});
