import React from 'react';
import { View, StyleSheet } from 'react-native';
import Reanimated, { FadeInDown } from 'react-native-reanimated';
import { Droplet, GlassWater } from 'lucide-react-native';
import { Texto, RecuadroGlass, colores } from '../../../../../../diseno';

function conAlpha(color: string, alpha: string) {
  return `${color}${alpha}`;
}

export function WidgetHidratacion({ acento }: { acento: string }) {
  // Datos simulados
  const hoyLitros = 2.1;
  const metaLitros = 2.5;
  const porcentaje = Math.min((hoyLitros / metaLitros) * 100, 100);

  const semana = [2.0, 2.5, 1.8, 2.7, 2.1, 1.5, 2.1];
  const dias = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];

  return (
    <View style={styles.raiz}>
      <Reanimated.View entering={FadeInDown.duration(400)}>
        <RecuadroGlass blur intensity={40} style={[styles.panel, { borderColor: conAlpha(acento, '20') }]}>
          <View style={styles.cabeceraPanel}>
            <View>
              <Texto style={styles.titulo}>Hidratación Diaria</Texto>
              <Texto style={styles.subtitulo}>Progreso hacia tu meta ideal</Texto>
            </View>
            <Droplet color={acento} size={18} />
          </View>

          <View style={styles.contenedorCilindro}>
            <View style={styles.cilindroBase}>
              <View style={[styles.cilindroRelleno, { height: `${porcentaje}%`, backgroundColor: acento }]} />
              <View style={[styles.olaReflejo, { top: `${100 - porcentaje}%` }]} />
            </View>
            <View style={styles.datosCilindro}>
              <Texto style={styles.textoAguaGigante}>{hoyLitros} <Texto style={{ fontSize: 18 }}>L</Texto></Texto>
              <Texto style={styles.textoEtiqueta}>de {metaLitros} L (Meta)</Texto>
            </View>
          </View>
        </RecuadroGlass>
      </Reanimated.View>

      <Reanimated.View entering={FadeInDown.duration(400).delay(100)}>
        <RecuadroGlass blur intensity={40} style={[styles.panel, { borderColor: conAlpha(acento, '20') }]}>
          <View style={styles.cabeceraPanel}>
            <View>
              <Texto style={styles.titulo}>Consistencia Semanal</Texto>
              <Texto style={styles.subtitulo}>Litros de agua por día</Texto>
            </View>
            <GlassWater color={acento} size={18} />
          </View>

          <View style={styles.graficaSemana}>
            {semana.map((litros, i) => {
              const hPercent = (litros / 3.0) * 100; // max 3L scale
              return (
                <View key={i} style={styles.columnaSemana}>
                  <Texto style={styles.textoMini}>{litros}L</Texto>
                  <View style={styles.barraFondoSemana}>
                    <View style={[styles.barraRellenoSemana, { height: `${hPercent}%`, backgroundColor: litros >= metaLitros ? acento : conAlpha(acento, '50') }]} />
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
  
  contenedorCilindro: { flexDirection: 'row', alignItems: 'center', marginTop: 24, paddingHorizontal: 12 },
  cilindroBase: { width: 60, height: 140, borderRadius: 30, backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', overflow: 'hidden', justifyContent: 'flex-end', position: 'relative' },
  cilindroRelleno: { width: '100%', borderRadius: 30 },
  olaReflejo: { position: 'absolute', width: '100%', height: 4, backgroundColor: 'rgba(255,255,255,0.4)' },
  datosCilindro: { marginLeft: 24 },
  textoAguaGigante: { fontFamily: 'MontserratAlternates-Bold', fontSize: 36, lineHeight: 43, color: colores.texto },
  textoEtiqueta: { fontFamily: 'MontserratAlternates-Medium', fontSize: 14, color: colores.textoSecundario },
  
  graficaSemana: { flexDirection: 'row', justifyContent: 'space-between', height: 120, marginTop: 24, paddingHorizontal: 4 },
  columnaSemana: { alignItems: 'center', justifyContent: 'flex-end', height: '100%', gap: 8 },
  barraFondoSemana: { width: 14, height: 80, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 7, overflow: 'hidden', justifyContent: 'flex-end' },
  barraRellenoSemana: { width: '100%', borderRadius: 7 },
  textoMini: { fontFamily: 'MontserratAlternates-SemiBold', fontSize: 9, color: colores.textoSecundario },
  diaLetra: { fontFamily: 'MontserratAlternates-SemiBold', fontSize: 12, color: colores.textoSecundario }
});
