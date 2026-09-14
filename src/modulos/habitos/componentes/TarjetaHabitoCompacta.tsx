import type { ImageSourcePropType } from 'react-native';
import { Image, Pressable, StyleSheet, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

import { MasterIcon, RecuadroGlass, Texto } from '../../../diseno';
import { obtenerAssetsSelvaPorTono } from '../iconosHabitos';

const DIAS_SEMANA_ETIQUETA = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];
const RADIO_ANILLO = 17;
const CIRCUNFERENCIA_ANILLO = 2 * Math.PI * RADIO_ANILLO;

export type TarjetaHabitoCompactaProps = {
  alto?: number;
  ancho?: number;
  diasCompletados?: number[];
  diasProgramados: number[];
  icono: { fuente: ImageSourcePropType };
  meta: number;
  nivel?: number;
  onPress: () => void;
  racha?: number;
  titulo: string;
  valorHoy?: number;
};

// Tarjeta rectangular y compacta de carrusel: icono arriba, título/subtítulo
// pegados, días debajo — árbol grande de fondo (real por tono) y anillo de
// meta de hoy en la esquina superior derecha.
export function TarjetaHabitoCompacta({
  alto = 104, ancho = 320, diasCompletados = [], diasProgramados, icono, meta, nivel = 1, onPress, racha = 0, titulo, valorHoy = 0,
}: TarjetaHabitoCompactaProps) {
  const assets = obtenerAssetsSelvaPorTono(nivel);
  const fraccionProgreso = Math.max(0.06, meta > 0 ? Math.min(1, valorHoy / meta) : 0.06);
  const offsetAnillo = CIRCUNFERENCIA_ANILLO * (1 - fraccionProgreso);

  return (
    <Pressable onPress={onPress} style={{ height: alto, width: ancho }}>
      <RecuadroGlass blur degradado={{ inicio: '#F4FFF1', fin: '#DDF5CE' }} style={tc.raiz}>
        <Image resizeMode="contain" source={assets.arbolPrincipal} style={tc.arbol} />
        <View style={tc.anilloMeta}>
          <Svg height={40} style={tc.anilloSvg} width={40}>
            <Circle cx="20" cy="20" fill="none" r={RADIO_ANILLO} stroke="rgba(20,92,55,.17)" strokeWidth={3.2} />
            <Circle cx="20" cy="20" fill="none" r={RADIO_ANILLO} rotation="-90" stroke="#145C37" strokeDasharray={`${CIRCUNFERENCIA_ANILLO} ${CIRCUNFERENCIA_ANILLO}`} strokeDashoffset={offsetAnillo} strokeLinecap="round" strokeWidth={3.2} origin="20,20" />
          </Svg>
          <Texto style={tc.anilloTexto}>{valorHoy}/{meta}</Texto>
        </View>
        <View style={tc.contenido}>
          <View style={tc.filaSuperior}>
            <View style={tc.iconoMarco}><Image resizeMode="contain" source={icono.fuente} style={tc.icono} /></View>
            <View>
              <Texto numberOfLines={1} style={tc.titulo}>{titulo}</Texto>
              <View style={tc.metaFila}>
                <Texto style={tc.meta}>Nivel {nivel} · </Texto>
                <MasterIcon color={2} name="racha" size={9} />
                <Texto style={tc.meta}> {racha} días</Texto>
              </View>
            </View>
          </View>
          <View style={tc.dias}>
            {DIAS_SEMANA_ETIQUETA.map((etiqueta, indice) => {
              const idDia = indice + 1;
              const programado = diasProgramados.includes(idDia);
              const completado = diasCompletados.includes(idDia);
              return (
                <View key={idDia} style={tc.dia}>
                  <Texto style={tc.diaTexto}>{etiqueta}</Texto>
                  <View style={[tc.diaCirculo, programado ? tc.diaCirculoProgramado : tc.diaCirculoNoAplica, completado && tc.diaCirculoCompletado]} />
                </View>
              );
            })}
          </View>
        </View>
      </RecuadroGlass>
    </Pressable>
  );
}

const tc = StyleSheet.create({
  raiz: { borderRadius: 16, flex: 1, overflow: 'hidden', padding: 12, position: 'relative' },
  arbol: { bottom: -20, height: 132, opacity: .9, position: 'absolute', right: -20, width: 132, zIndex: 0 },
  anilloMeta: { alignItems: 'center', height: 40, justifyContent: 'center', position: 'absolute', right: 10, top: 10, width: 40, zIndex: 3 },
  anilloSvg: { position: 'absolute' },
  anilloTexto: { color: '#12331F', fontFamily: 'MontserratAlternates-Bold', fontSize: 10 },
  contenido: { zIndex: 2 },
  filaSuperior: { alignItems: 'center', flexDirection: 'row', gap: 10 },
  iconoMarco: { alignItems: 'center', backgroundColor: 'rgba(255,255,255,.55)', borderRadius: 12, height: 40, justifyContent: 'center', width: 40 },
  icono: { height: 24, width: 24 },
  titulo: { color: '#12331F', fontFamily: 'MontserratAlternates-Bold', fontSize: 12 },
  metaFila: { alignItems: 'center', flexDirection: 'row', marginTop: 0 },
  meta: { color: '#4A7F5D', fontFamily: 'Montserrat-Medium', fontSize: 8 },
  dias: { flexDirection: 'row', gap: 4, marginTop: 6 },
  dia: { alignItems: 'center', gap: 2 },
  diaTexto: { color: '#3C6650', fontFamily: 'Montserrat-Bold', fontSize: 8 },
  diaCirculo: { borderRadius: 5, height: 9, width: 9 },
  diaCirculoProgramado: { backgroundColor: 'rgba(37,136,76,.2)' },
  diaCirculoNoAplica: { backgroundColor: 'rgba(90,128,105,.14)' },
  diaCirculoCompletado: { backgroundColor: '#25884C' },
});
