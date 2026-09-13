import type { ImageSourcePropType } from 'react-native';
import { Image, Pressable, StyleSheet, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

import { RecuadroGlass, Texto } from '../../../diseno';
import { obtenerAssetsSelvaPorTono } from '../iconosHabitos';

const DIAS_SEMANA = 7;
const RADIO_ANILLO = 14;
const CIRCUNFERENCIA_ANILLO = 2 * Math.PI * RADIO_ANILLO;

export type TarjetaHabitoCompactaProps = {
  diasCompletados?: number[];
  diasProgramados: number[];
  icono: { fuente: ImageSourcePropType };
  meta: number;
  nivel?: number;
  onPress: () => void;
  racha?: number;
  seleccionada?: boolean;
  titulo: string;
  valorHoy?: number;
};

// Versión horizontal y compacta de TarjetaSenderoHabito, para listas —
// mismo lenguaje visual (glass verde, árbol real por tono, anillo de meta),
// pensada para ocupar ~110px de alto en vez de ~440px.
export function TarjetaHabitoCompacta({
  diasCompletados = [], diasProgramados, icono, meta, nivel = 1, onPress, racha = 0, seleccionada = false, titulo, valorHoy = 0,
}: TarjetaHabitoCompactaProps) {
  const assets = obtenerAssetsSelvaPorTono(nivel);
  const fraccionProgreso = Math.max(0.06, meta > 0 ? Math.min(1, valorHoy / meta) : 0.06);
  const offsetAnillo = CIRCUNFERENCIA_ANILLO * (1 - fraccionProgreso);

  return (
    <Pressable onPress={onPress} style={tc.contenedor}>
      <RecuadroGlass blur degradado={{ inicio: '#F4FFF1', fin: '#B8EDB0' }} style={[tc.raiz, seleccionada && tc.raizSeleccionada]}>
        <Image source={assets.arbolPrincipal} style={tc.arbol} />
        <View style={tc.iconoMarco}>
          <RecuadroGlass blur degradado={{ inicio: '#F4FFF1', fin: '#B8EDB0' }} style={tc.iconoGlass}><Image source={icono.fuente} style={tc.icono} /></RecuadroGlass>
        </View>
        <View style={tc.info}>
          <Texto numberOfLines={1} style={tc.titulo}>{titulo}</Texto>
          <Texto style={tc.meta}>Nivel {nivel} · {racha} días de racha</Texto>
          <View style={tc.dias}>
            {Array.from({ length: DIAS_SEMANA }, (_, indice) => {
              const idDia = indice + 1;
              const programado = diasProgramados.includes(idDia);
              const completado = diasCompletados.includes(idDia);
              return <View key={idDia} style={[tc.diaPunto, programado ? tc.diaPuntoProgramado : tc.diaPuntoNoAplica, completado && tc.diaPuntoCompletado]} />;
            })}
          </View>
        </View>
        <View style={tc.anilloMeta}>
          <Svg height={38} style={tc.anilloSvg} width={38}>
            <Circle cx="19" cy="19" fill="none" r={RADIO_ANILLO} stroke="rgba(20,92,55,.17)" strokeWidth={3.5} />
            <Circle cx="19" cy="19" fill="none" r={RADIO_ANILLO} rotation="-90" stroke="#25884C" strokeDasharray={`${CIRCUNFERENCIA_ANILLO} ${CIRCUNFERENCIA_ANILLO}`} strokeDashoffset={offsetAnillo} strokeLinecap="round" strokeWidth={3.5} origin="19,19" />
          </Svg>
          <Texto style={tc.anilloTexto}>{valorHoy}/{meta}</Texto>
        </View>
      </RecuadroGlass>
    </Pressable>
  );
}

const tc = StyleSheet.create({
  contenedor: { height: 108, width: 272 },
  raiz: { alignItems: 'center', borderRadius: 20, flex: 1, flexDirection: 'row', gap: 10, overflow: 'hidden', padding: 12, position: 'relative' },
  raizSeleccionada: { borderColor: '#25884C', borderWidth: 1.5 },
  arbol: { height: 150, opacity: .3, position: 'absolute', resizeMode: 'contain', right: -34, top: -18, width: 130, zIndex: 0 },
  iconoMarco: { alignItems: 'center', borderRadius: 14, elevation: 2, height: 48, justifyContent: 'center', shadowColor: '#176836', shadowOffset: { height: 3, width: 2 }, shadowOpacity: .14, shadowRadius: 5, width: 48, zIndex: 2 },
  iconoGlass: { alignItems: 'center', borderRadius: 14, flex: 1, justifyContent: 'center', width: '100%' },
  icono: { height: 30, resizeMode: 'contain', width: 30 },
  info: { flex: 1, gap: 3, zIndex: 2 },
  titulo: { color: '#145C37', fontFamily: 'MontserratAlternates-Bold', fontSize: 15 },
  meta: { color: '#4A7F5D', fontFamily: 'Montserrat-Medium', fontSize: 10 },
  dias: { flexDirection: 'row', gap: 4, marginTop: 2 },
  diaPunto: { borderRadius: 4, height: 7, width: 7 },
  diaPuntoProgramado: { backgroundColor: 'rgba(37,136,76,.25)' },
  diaPuntoNoAplica: { backgroundColor: 'rgba(90,128,105,.14)' },
  diaPuntoCompletado: { backgroundColor: '#25884C' },
  anilloMeta: { alignItems: 'center', height: 38, justifyContent: 'center', width: 38, zIndex: 2 },
  anilloSvg: { position: 'absolute' },
  anilloTexto: { color: '#145C37', fontFamily: 'MontserratAlternates-Bold', fontSize: 8 },
});
