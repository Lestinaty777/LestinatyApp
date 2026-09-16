import type { ImageSourcePropType } from 'react-native';
import { Image, Pressable, StyleSheet, View } from 'react-native';
import Svg, { Circle, Defs, Pattern, Rect } from 'react-native-svg';

import { MasterGlass, Texto } from '../../../diseno';
import { obtenerAssetsSelvaPorTono } from '../iconosHabitos';

const DIAS_SEMANA_ETIQUETA = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];
const RADIO_ANILLO = 14;
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

const TexturaDither = () => (
  <View style={[StyleSheet.absoluteFill, { opacity: 0.15 }]} pointerEvents="none">
    <Svg width="100%" height="100%">
      <Defs>
        <Pattern id="dither" patternUnits="userSpaceOnUse" width="4" height="4">
          <Rect x="0" y="0" width="2" height="2" fill="#FFFFFF" />
          <Rect x="2" y="2" width="2" height="2" fill="#FFFFFF" />
        </Pattern>
      </Defs>
      <Rect width="100%" height="100%" fill="url(#dither)" />
    </Svg>
  </View>
);

export function TarjetaHabitoCompacta({
  alto = 92, ancho = 200, diasCompletados = [], diasProgramados, icono, meta, nivel = 1, onPress, racha = 0, titulo, valorHoy = 0,
}: TarjetaHabitoCompactaProps) {
  const assets = obtenerAssetsSelvaPorTono(nivel);
  const fraccionProgreso = Math.max(0.06, meta > 0 ? Math.min(1, valorHoy / meta) : 0.06);
  const offsetAnillo = CIRCUNFERENCIA_ANILLO * (1 - fraccionProgreso);

  return (
    <Pressable onPress={onPress} style={{ height: alto, width: ancho }}>
      {({ pressed }) => (
        <MasterGlass blur intensity={40} style={[tc.raiz, { transform: [{ translateY: pressed ? 2 : 0 }] }]}>
          <TexturaDither />
          
          <Image resizeMode="contain" source={assets.arbolPrincipal} style={tc.arbol} />

          <View style={tc.filaSuperior}>
            <View style={tc.iconoContenedor}>
              <Image resizeMode="contain" source={icono.fuente} style={tc.icono} />
            </View>
            
            <View style={tc.textosContenedor}>
              <Texto numberOfLines={1} style={tc.titulo}>{titulo}</Texto>
              <Texto numberOfLines={1} style={tc.subtitulo}>Nv {nivel} • {racha} d</Texto>
            </View>

            <View style={tc.anilloContenedor}>
              <Svg height={30} width={30} style={{ position: 'absolute' }}>
                <Circle cx="15" cy="15" fill="none" r={RADIO_ANILLO} stroke="rgba(255,255,255,0.25)" strokeWidth={3} />
                <Circle cx="15" cy="15" fill="none" r={RADIO_ANILLO} rotation="-90" stroke="#124C29" strokeDasharray={`${CIRCUNFERENCIA_ANILLO} ${CIRCUNFERENCIA_ANILLO}`} strokeDashoffset={offsetAnillo} strokeLinecap="round" strokeWidth={3} origin="15,15" />
              </Svg>
              <Texto style={tc.anilloTexto}>{valorHoy}/{meta}</Texto>
            </View>
          </View>

          <View style={tc.diasFila}>
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
        </MasterGlass>
      )}
    </Pressable>
  );
}

const tc = StyleSheet.create({
  raiz: { 
    borderRadius: 16, 
    flex: 1, 
    overflow: 'hidden', 
    paddingHorizontal: 12, 
    paddingVertical: 10,
    justifyContent: 'space-between'
  },
  arbol: { 
    bottom: -20, 
    height: 100, 
    opacity: 0.2, 
    position: 'absolute', 
    right: -20, 
    width: 100, 
    zIndex: 0 
  },
  filaSuperior: { 
    alignItems: 'center', 
    flexDirection: 'row', 
    gap: 8,
    zIndex: 2 
  },
  iconoContenedor: { 
    alignItems: 'center', 
    backgroundColor: 'rgba(255,255,255,0.5)', 
    borderRadius: 10, 
    height: 30, 
    justifyContent: 'center', 
    width: 30 
  },
  icono: { 
    height: 16, 
    width: 16 
  },
  textosContenedor: { 
    flex: 1, 
    justifyContent: 'center' 
  },
  titulo: { 
    color: '#12331F', 
    fontFamily: 'MontserratAlternates-Bold', 
    fontSize: 12, 
    marginBottom: 2 
  },
  subtitulo: { 
    color: '#255C3D', 
    fontFamily: 'Montserrat-SemiBold', 
    fontSize: 9 
  },
  anilloContenedor: { 
    alignItems: 'center', 
    height: 30, 
    justifyContent: 'center', 
    width: 30 
  },
  anilloTexto: { 
    color: '#12331F', 
    fontFamily: 'MontserratAlternates-Bold', 
    fontSize: 8 
  },
  diasFila: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    zIndex: 2,
    paddingHorizontal: 0
  },
  dia: { 
    alignItems: 'center', 
    gap: 3 
  },
  diaTexto: { 
    color: '#3C6650', 
    fontFamily: 'Montserrat-Bold', 
    fontSize: 7 
  },
  diaCirculo: { 
    borderRadius: 4, 
    height: 8, 
    width: 8 
  },
  diaCirculoProgramado: { 
    backgroundColor: 'rgba(255,255,255,0.6)' 
  },
  diaCirculoNoAplica: { 
    backgroundColor: 'rgba(0,0,0,0.06)' 
  },
  diaCirculoCompletado: { 
    backgroundColor: '#145C37' 
  },
});
