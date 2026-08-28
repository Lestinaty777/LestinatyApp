import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import Reanimated, { FadeInDown, useSharedValue, useAnimatedStyle, withRepeat, withSequence, withTiming, useAnimatedProps, Easing } from 'react-native-reanimated';
import Svg, { Path, Circle, Defs, LinearGradient, Stop } from 'react-native-svg';

const AnimatedPath = Reanimated.createAnimatedComponent(Path);
const AnimatedCircle = Reanimated.createAnimatedComponent(Circle);
import { Clock, Zap, Target, PieChart, Activity } from 'lucide-react-native';

import { Texto, RecuadroGlass, colores } from '../../../../../diseno';
import { MapaCalor } from './MapaCalor';

interface Props {
  datos: any;
  acento: string;
  itemsCargados: number;
  senderoFiltro?: { titulo: string; meta?: string } | null;
}

function conAlpha(color: string, alpha: string) {
  return `${color}${alpha}`;
}

export function RutinasAnalisis({ acento, itemsCargados, senderoFiltro, datos }: Props) {
  const pulsoEnergia = useSharedValue(0.7);
  const rayoOffset = useSharedValue(0);

  useEffect(() => {

    rayoOffset.value = withRepeat(
      withTiming(1, { duration: 2500, easing: Easing.linear }),
      -1,
      false
    );
  }, []);

  const estiloGlow = useAnimatedStyle(() => ({
    opacity: pulsoEnergia.value,
  }));
  
  // Sombra falsa de neón para vistas
  const svgProps = useAnimatedProps(() => ({
    // Removed opacity pulse for readability
  })) as any;

  const gaugeBeamProps = useAnimatedProps(() => ({
    strokeDashoffset: 220 - (rayoOffset.value * 300)
  })) as any;

  const donutBeamProps = useAnimatedProps(() => ({
    strokeDashoffset: 377 - (rayoOffset.value * 450)
  })) as any;

  const beamStyleH = useAnimatedStyle(() => ({
    transform: [
      { translateX: -20 + (rayoOffset.value * 350) }
    ]
  }));

  const beamStyleV = useAnimatedStyle(() => ({
    transform: [
      { translateY: -10 + (rayoOffset.value * 130) }
    ]
  }));

  const estiloNeon = useAnimatedStyle(() => ({
    shadowColor: acento,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 8,
    elevation: 4
  }));
if (senderoFiltro === null) {
    return (
      <View style={styles.raiz}>
        {itemsCargados < 1 ? (
          <View style={[styles.skeleton, { height: 260 }]} />
        ) : (
          <Reanimated.View entering={FadeInDown.duration(400)}>
            <RecuadroGlass blur intensity={40} style={[styles.panel, { borderColor: conAlpha(acento, '20') }]}>
              <View style={styles.cabeceraPanel}>
                <View>
                  <Texto style={styles.titulo}>Consistencia Mensual</Texto>
                  <Texto style={styles.subtitulo}>Mapa de calor de tus rutinas</Texto>
                </View>
                <View style={[styles.iconoCaja, { backgroundColor: conAlpha(acento, '15') }]}>
                  <Activity color={acento} size={18} />
                </View>
              </View>
              <MapaCalor datos={datos.actividadReciente || []} acento={acento} />
            </RecuadroGlass>
          </Reanimated.View>
        )}

        {itemsCargados < 2 ? (
          <View style={[styles.skeleton, { height: 120 }]} />
        ) : (
          <Reanimated.View entering={FadeInDown.duration(400).delay(100)}>
            <RecuadroGlass blur intensity={40} style={[styles.panel, { borderColor: conAlpha(acento, '20') }]}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 12 }}>
                <Texto style={[styles.numeroGigante, { color: colores.texto }]}>
                  78<Texto style={{ fontSize: 16, color: colores.textoSecundario }}>%</Texto>
                </Texto>
                <Texto style={styles.subtitulo}>Tasa Global de Cumplimiento</Texto>
              </View>
              <View style={styles.barraFondo}>
                <Reanimated.View style={[styles.barraRelleno, estiloNeon, { backgroundColor: acento, width: '78%', overflow: 'hidden' }]}>
                  <Reanimated.View style={[{ width: 4, height: '100%', backgroundColor: '#FFFFFF', position: 'absolute', top: 0, left: 0, opacity: 0.8, borderRadius: 2, shadowColor: '#FFF', shadowOpacity: 1, shadowRadius: 4 }, beamStyleH]} />
                </Reanimated.View>
              </View>
            </RecuadroGlass>
          </Reanimated.View>
        )}
      </View>
    );
  }

  // VISTA INDIVIDUAL (Rayos X)
  return (
    <View style={styles.raiz}>
      
      {/* 1. EFICIENCIA (COMPARISON) & HORA PICO */}
      {itemsCargados < 1 ? (
        <View style={styles.filaDoble}>
          <View style={[styles.skeleton, styles.panelMitad, { height: 160 }]} />
          <View style={[styles.skeleton, styles.panelMitad, { height: 160 }]} />
        </View>
      ) : (
        <Reanimated.View entering={FadeInDown.duration(400)} style={styles.filaDoble}>
          
          {/* Eficiencia */}
          <RecuadroGlass blur intensity={40} style={[styles.panelMitad, { borderColor: conAlpha(acento, '20') }]}>
            <View style={styles.cabeceraMini}>
              <Zap color={acento} size={16} />
              <Texto style={styles.tituloMini}>Eficiencia</Texto>
            </View>
            <Texto style={styles.subtituloMini}>15% más rápido</Texto>

            <View style={styles.comparacionCaja}>
              <View>
                <View style={styles.comparacionTexto}>
                  <Texto style={styles.textoEtiqueta}>Estimado</Texto>
                  <Texto style={styles.textoValor}>45m</Texto>
                </View>
                <View style={styles.barraFondo}>
                  <View style={[styles.barraRelleno, { backgroundColor: conAlpha(acento, '60'), width: '100%' }]} />
                </View>
              </View>
              
              <View style={{ marginTop: 12 }}>
                <View style={styles.comparacionTexto}>
                  <Texto style={styles.textoEtiqueta}>Real</Texto>
                  <Texto style={styles.textoValor}>38m</Texto>
                </View>
                <View style={styles.barraFondo}>
                  <Reanimated.View style={[styles.barraRelleno, estiloNeon, { backgroundColor: acento, width: '84.4%', overflow: 'hidden' }]}>
                  <Reanimated.View style={[{ width: 4, height: '100%', backgroundColor: '#FFFFFF', position: 'absolute', top: 0, left: 0, opacity: 0.8, borderRadius: 2, shadowColor: '#FFF', shadowOpacity: 1, shadowRadius: 4 }, beamStyleH]} />
                </Reanimated.View>
                </View>
              </View>
            </View>
          </RecuadroGlass>

          {/* Hora Pico */}
          <RecuadroGlass blur intensity={40} style={[styles.panelMitad, { borderColor: conAlpha(acento, '20'), justifyContent: 'center' }]}>
            <View style={{ alignItems: 'center' }}>
              <Clock color={conAlpha(acento, '80')} size={24} style={{ marginBottom: 12 }} />
              <Texto style={[styles.numeroGigante, { color: colores.texto }]} numberOfLines={1} adjustsFontSizeToFit>6:42<Texto style={{ fontSize: 16, color: colores.textoSecundario }}> AM</Texto></Texto>
              <Texto style={[styles.subtituloMini, { marginTop: 4 }]}>Hora pico de inicio</Texto>
            </View>
          </RecuadroGlass>

        </Reanimated.View>
      )}

      {/* 2. FRICCION (BARS) */}
      {itemsCargados < 2 ? (
        <View style={[styles.skeleton, { height: 200 }]} />
      ) : (
        <Reanimated.View entering={FadeInDown.duration(400)}>
          <RecuadroGlass blur intensity={40} style={[styles.panel, { borderColor: conAlpha(acento, '20') }]}>
            <View style={styles.cabeceraPanel}>
              <View>
                <Texto style={styles.titulo}>Puntos de Fricción</Texto>
                <Texto style={styles.subtitulo}>¿En qué paso sueles abandonar?</Texto>
              </View>
              <View style={[styles.iconoCaja, { backgroundColor: conAlpha(acento, '15') }]}>
                <Activity color={acento} size={18} />
              </View>
            </View>

            <View style={styles.gridBarrasVerticales}>
              {[
                { val: '5%', h: '14.7%', lbl: 'Paso 1' },
                { val: '8%', h: '23.5%', lbl: 'Paso 2' },
                { val: '12%', h: '35.3%', lbl: 'Paso 3' },
                { val: '34%', h: '100%', lbl: 'Paso 4', critico: true },
                { val: '18%', h: '52.9%', lbl: 'Paso 5' },
                { val: '9%', h: '26.5%', lbl: 'Paso 6' },
              ].map((b, i) => (
                <View key={i} style={styles.columnaBarra}>
                  <Texto style={[styles.etiquetaPorcentaje, b.critico && { color: acento, fontWeight: 'bold' }]}>{b.val}</Texto>
                  <View style={styles.barraVerticalFondo}>
                    <Reanimated.View style={[styles.barraVerticalRelleno, b.critico ? estiloNeon : undefined, { backgroundColor: b.critico ? acento : conAlpha(acento, '60'), height: b.h as any, overflow: 'hidden' }]}>
                      {b.critico && <Reanimated.View style={[{ width: '100%', height: 4, backgroundColor: '#FFFFFF', position: 'absolute', left: 0, top: 0, opacity: 0.8, borderRadius: 2, shadowColor: '#FFF', shadowOpacity: 1, shadowRadius: 4 }, beamStyleV]} />}
                    </Reanimated.View>
                  </View>
                  <Texto style={styles.etiquetaPaso} numberOfLines={1}>{b.lbl}</Texto>
                </View>
              ))}
            </View>
          </RecuadroGlass>
        </Reanimated.View>
      )}

      {/* 3. GAUGE & DONUT */}
      {itemsCargados < 3 ? (
        <View style={styles.filaDoble}>
          <View style={[styles.skeleton, styles.panelMitad, { height: 210 }]} />
          <View style={[styles.skeleton, styles.panelMitad, { height: 210 }]} />
        </View>
      ) : (
        <Reanimated.View entering={FadeInDown.duration(400)} style={styles.filaDoble}>
          
          {/* Gauge: Racha Máxima */}
          <RecuadroGlass blur intensity={40} style={[styles.panelMitad, { borderColor: conAlpha(acento, '20'), paddingHorizontal: 8 }]}>
            <View style={[styles.cabeceraMini, { paddingHorizontal: 8 }]}>
              <Target color={acento} size={16} />
              <Texto style={styles.tituloMini}>Mejor Racha</Texto>
            </View>
            
            <View style={{ alignItems: 'center', marginTop: 16 }}>
              <Svg width="120" height="80" viewBox="0 0 200 120">
                
                <Path d="M 20 100 A 70 70 0 0 1 180 100" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth={14} strokeLinecap="round" />
                <Defs>
                  <LinearGradient id="gauge" x1="0%" y1="0%" x2="100%" y2="0%">
                    <Stop offset="0%" stopColor={conAlpha(acento, '40')} />
                    <Stop offset="100%" stopColor={acento} />
                  </LinearGradient>
                </Defs>
                <AnimatedPath d="M 20 100 A 70 70 0 0 1 180 100" fill="none" stroke="url(#gauge)" strokeWidth={14} strokeLinecap="round" strokeDasharray="219.91" strokeDashoffset="14.66" animatedProps={svgProps} />
                <AnimatedPath d="M 20 100 A 70 70 0 0 1 180 100" fill="none" stroke="rgba(255,255,255,0.8)" strokeWidth={6} strokeLinecap="round" strokeDasharray="15 220" animatedProps={gaugeBeamProps} />
              </Svg>
              <View style={styles.textoGaugeAbsoluto}>
                <Texto style={[styles.numeroGigante, { fontSize: 24, lineHeight: 28 }]} numberOfLines={1} adjustsFontSizeToFit>28<Texto style={{ fontSize: 12, color: colores.textoSecundario }}> d</Texto></Texto>
              </View>
            </View>
          </RecuadroGlass>

          {/* Donut: Cumplimiento */}
          <RecuadroGlass blur intensity={40} style={[styles.panelMitad, { borderColor: conAlpha(acento, '20'), paddingHorizontal: 8 }]}>
            <View style={[styles.cabeceraMini, { paddingHorizontal: 8 }]}>
              <PieChart color={acento} size={16} />
              <Texto style={styles.tituloMini}>Cumplimiento</Texto>
            </View>
            
            <View style={{ alignItems: 'center', marginTop: 8 }}>
              <Svg width="90" height="90" viewBox="0 0 160 160">
                <Circle cx="80" cy="80" r="60" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="18" />
                <AnimatedCircle cx="80" cy="80" r="60" fill="none" stroke={acento} strokeWidth="18" strokeDasharray="256.35 120.64" transform="rotate(-90 80 80)" animatedProps={svgProps} />
                <AnimatedCircle cx="80" cy="80" r="60" fill="none" stroke="rgba(255,255,255,0.8)" strokeWidth={6} strokeDasharray="15 377" transform="rotate(-90 80 80)" animatedProps={donutBeamProps} />
                <Circle cx="80" cy="80" r="60" fill="none" stroke={conAlpha(acento, '30')} strokeWidth="18" strokeDasharray="120.64 256.35" transform="rotate(154.8 80 80)" />
              </Svg>
              <View style={[styles.textoGaugeAbsoluto, { top: 31 }]}>
                <Texto style={[styles.numeroGigante, { fontSize: 18, lineHeight: 22 }]} numberOfLines={1} adjustsFontSizeToFit>68%</Texto>
              </View>
            </View>
            
            <View style={{ marginTop: 12, paddingHorizontal: 8, gap: 4 }}>
              <View style={styles.leyendaItem}>
                <View style={[styles.leyendaPunto, { backgroundColor: acento }]} />
                <Texto style={styles.leyendaTexto}>Completas</Texto>
              </View>
              <View style={styles.leyendaItem}>
                <View style={[styles.leyendaPunto, { backgroundColor: conAlpha(acento, '30') }]} />
                <Texto style={styles.leyendaTexto}>A medias</Texto>
              </View>
            </View>

          </RecuadroGlass>
        </Reanimated.View>
      )}

    </View>
  );
}

const styles = StyleSheet.create({
  raiz: { gap: 12, paddingBottom: 20 },
  skeleton: { backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 24, borderColor: 'rgba(255,255,255,0.1)', borderWidth: 1, marginTop: 12 },
  panel: { padding: 18, borderRadius: 24, borderWidth: 1, marginTop: 12, overflow: 'hidden' },
  filaDoble: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 12 },
  panelMitad: { width: '48%', padding: 14, borderRadius: 24, borderWidth: 1 },


  cabeceraMini: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  tituloMini: { fontFamily: 'MontserratAlternates-Bold', fontSize: 13, color: colores.texto },
  subtituloMini: { fontFamily: 'MontserratAlternates-Medium', fontSize: 10, color: colores.textoSecundario },
  cabeceraPanel: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  titulo: { fontFamily: 'MontserratAlternates-Bold', fontSize: 16, color: colores.texto },
  subtitulo: { fontFamily: 'MontserratAlternates-Medium', fontSize: 11, color: colores.textoSecundario, marginTop: 2 },
  iconoCaja: { width: 36, height: 36, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  
  // Barras horizontales
  comparacionCaja: { marginTop: 16 },
  comparacionTexto: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  textoEtiqueta: { fontFamily: 'MontserratAlternates-Medium', fontSize: 11, color: colores.textoSecundario },
  textoValor: { fontFamily: 'MontserratAlternates-Bold', fontSize: 13, color: colores.texto },
  barraFondo: { height: 12, width: '100%', backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 99, overflow: 'hidden' },
  barraRelleno: { height: '100%', borderRadius: 99 },
  
  // Barras Verticales
  gridBarrasVerticales: { flexDirection: 'row', justifyContent: 'space-between', height: 120, marginTop: 24, alignItems: 'flex-end' },
  columnaBarra: { flex: 1, alignItems: 'center', gap: 6 },
  etiquetaPorcentaje: { fontFamily: 'MontserratAlternates-SemiBold', fontSize: 10, color: colores.textoSecundario },
  barraVerticalFondo: { flex: 1, width: 28, justifyContent: 'flex-end', backgroundColor: 'transparent' },
  barraVerticalRelleno: { width: '100%', borderTopLeftRadius: 6, borderTopRightRadius: 6 },
  etiquetaPaso: { fontFamily: 'MontserratAlternates-Medium', fontSize: 9, color: colores.textoSecundario, opacity: 0.6 },
  
  // Textos y Gaugues
  numeroGigante: { fontFamily: 'MontserratAlternates-Bold', fontSize: 32, lineHeight: 36 },
  textoGaugeAbsoluto: { position: 'absolute', bottom: 12 },
  
  // Leyenda
  leyendaItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  leyendaPunto: { width: 8, height: 8, borderRadius: 4 },
  leyendaTexto: { fontFamily: 'MontserratAlternates-Medium', fontSize: 10, color: colores.textoSecundario }
});
