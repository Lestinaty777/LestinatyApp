import React from 'react';
import { View, StyleSheet } from 'react-native';
import Reanimated, { FadeInDown } from 'react-native-reanimated';
import { Droplet, GlassWater, Coffee, Zap, LucideIcon } from 'lucide-react-native'; // import common icons or dynamically require them
import { Texto, RecuadroGlass, colores } from '../../../../../diseno';
import { ContentPack, UserMetric } from '../arquitectura/tipos_sdui';

function conAlpha(color: string, alpha: string) {
  return `${color}${alpha}`;
}

const IconMap: Record<string, LucideIcon> = {
  'droplet': Droplet,
  'glass-water': GlassWater,
  'coffee': Coffee,
  'zap': Zap
};

interface Props {
  pack: ContentPack;
  data: { hoy: number, semana: number[] }; // Simplified data injection for the mockup
  acento: string;
}

export function MotorCilindro({ pack, data, acento }: Props) {
  const Icon = IconMap[pack.icon] || Droplet;
  const meta = parseFloat(pack.microcopy.done) || 2.5; // Quick hack for target via microcopy or hardcoded 
  const target = 2.5; // We should ideally add `target` to ContentPack or deduce it. Let's assume target = 100 or something, wait: `data_shape` has target.
  const porcentaje = Math.min((data.hoy / target) * 100, 100);

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

          <View style={styles.contenedorCilindro}>
            <View style={styles.cilindroBase}>
              <View style={[styles.cilindroRelleno, { height: `${porcentaje}%`, backgroundColor: acento }]} />
              <View style={[styles.olaReflejo, { top: `${100 - porcentaje}%` }]} />
            </View>
            <View style={styles.datosCilindro}>
              <Texto style={styles.textoGigante}>{data.hoy} <Texto style={{ fontSize: 18 }}>{pack.unit}</Texto></Texto>
              <Texto style={styles.textoEtiqueta}>{pack.value_label}</Texto>
              <Texto style={[styles.textoMini, { color: acento, marginTop: 8 }]}>{pack.microcopy.onTrack}</Texto>
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
  
  contenedorCilindro: { flexDirection: 'row', alignItems: 'center', marginTop: 24, paddingHorizontal: 12 },
  cilindroBase: { width: 60, height: 140, borderRadius: 30, backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', overflow: 'hidden', justifyContent: 'flex-end', position: 'relative' },
  cilindroRelleno: { width: '100%', borderRadius: 30 },
  olaReflejo: { position: 'absolute', width: '100%', height: 4, backgroundColor: 'rgba(255,255,255,0.4)' },
  datosCilindro: { marginLeft: 24, flex: 1 },
  textoGigante: { fontFamily: 'MontserratAlternates-Bold', fontSize: 36, lineHeight: 43, color: colores.texto },
  textoEtiqueta: { fontFamily: 'MontserratAlternates-Medium', fontSize: 14, color: colores.textoSecundario },
  textoMini: { fontFamily: 'MontserratAlternates-SemiBold', fontSize: 11 }
});
