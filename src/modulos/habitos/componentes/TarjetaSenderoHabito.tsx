import type { ImageSourcePropType } from 'react-native';
import { Image, StyleSheet, View } from 'react-native';
import { Play } from 'lucide-react-native';
import Svg, { Circle, Defs, LinearGradient, Rect, Stop } from 'react-native-svg';

import { Boton, MasterIcon, RecuadroGlass, Texto } from '../../../diseno';
import type { AssetsSelvaTono } from '../iconosHabitos';

const DIAS_SEMANA_ETIQUETA = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
const RADIO_ANILLO = 19;
const CIRCUNFERENCIA_ANILLO = 2 * Math.PI * RADIO_ANILLO;

export type TarjetaSenderoHabitoProps = {
  assets: AssetsSelvaTono;
  cargando?: boolean;
  ctaTexto?: string;
  descripcion?: string;
  diasCompletados?: number[];
  diasProgramados: number[];
  escalaArbol?: number;
  icono: { fuente: ImageSourcePropType };
  meta: number;
  metaEtiqueta: string;
  nivel?: number;
  onPressCta?: () => void;
  racha?: number;
  titulo: string;
  valorHoy?: number;
};

// Tarjeta rica de hábito: nace en el paso "Tu hábito está listo" del wizard de
// creación (como previsualización, sin datos reales) y es la misma que se usa
// en HabitosPantalla con datos reales — un solo componente, dos contextos.
export function TarjetaSenderoHabito({
  assets, cargando = false, ctaTexto = 'Comenzar', descripcion = '', diasCompletados = [], diasProgramados,
  escalaArbol = 1, icono, meta, metaEtiqueta, nivel = 1, onPressCta, racha = 0, titulo, valorHoy = 0,
}: TarjetaSenderoHabitoProps) {
  const fraccionProgreso = Math.max(0.06, meta > 0 ? Math.min(1, valorHoy / meta) : 0.06);
  const offsetAnillo = CIRCUNFERENCIA_ANILLO * (1 - fraccionProgreso);

  return (
    <View style={tp.contenedor}>
      <RecuadroGlass blur degradado={{ inicio: '#F4FFF1', fin: '#B8EDB0' }} style={tp.raiz}>
        <Image source={assets.arbolPrincipal} style={[tp.arbol, { transform: [{ scale: escalaArbol }] }]} />
        <View style={tp.iconoMarco}>
          <Svg pointerEvents="none" style={tp.bordeIcono} height={68} width={68}>
            <Defs><LinearGradient id="bordeIconoHabito" x1="0%" x2="100%" y1="0%" y2="100%"><Stop offset="0" stopColor="#C5F7B6" /><Stop offset="1" stopColor="#539C68" /></LinearGradient></Defs>
            <Rect fill="url(#bordeIconoHabito)" height={68} rx={18} ry={18} width={68} />
          </Svg>
          <RecuadroGlass blur degradado={{ inicio: '#F4FFF1', fin: '#B8EDB0' }} style={tp.iconoGlass}><Image source={icono.fuente} style={tp.icono} /></RecuadroGlass>
        </View>
        <View style={tp.texto}>
          <Texto style={tp.titulo}>{titulo || 'Mi hábito'}</Texto>
          <View style={tp.metaObjetivo}>
            <View style={tp.anilloMeta}>
              <Svg height={48} style={tp.anilloSvg} width={48}>
                <Circle cx="24" cy="24" fill="none" r={RADIO_ANILLO} stroke="rgba(20,92,55,.17)" strokeWidth={4} />
                <Circle cx="24" cy="24" fill="none" r={RADIO_ANILLO} rotation="-90" stroke="#25884C" strokeDasharray={`${CIRCUNFERENCIA_ANILLO} ${CIRCUNFERENCIA_ANILLO}`} strokeDashoffset={offsetAnillo} strokeLinecap="round" strokeWidth={4} origin="24,24" />
              </Svg>
              <Texto style={tp.anilloCero}>{valorHoy}</Texto>
            </View>
            <View>
              <Texto style={tp.metaEtiqueta}>Meta de hoy</Texto>
              <Texto style={tp.metaValor}>{valorHoy}/{metaEtiqueta}</Texto>
            </View>
          </View>
          {Boolean(descripcion.trim()) && <Texto numberOfLines={2} style={tp.descripcion}>{descripcion.trim()}</Texto>}
        </View>
        <View style={tp.metricas}>
          <View style={tp.metrica}><MasterIcon color={2} name="racha" size={25} /><Texto style={tp.metricaTexto}>{racha} días</Texto></View>
          <View style={tp.metrica}><MasterIcon color={2} name={`nivel${nivel}`} size={25} /><Texto style={tp.metricaTexto}>Nivel {nivel}</Texto></View>
        </View>
        <View style={tp.semana}>
          <View style={tp.semanaTitulo}>
            <Texto style={tp.semanaTexto}>Esta semana</Texto>
            <Texto style={tp.semanaTexto}>{diasCompletados.length}/{diasProgramados.length}</Texto>
          </View>
          <View style={tp.dias}>
            {DIAS_SEMANA_ETIQUETA.map((etiqueta, indice) => {
              const idDia = indice + 1;
              const programado = diasProgramados.includes(idDia);
              const completado = diasCompletados.includes(idDia);
              return (
                <View key={idDia} style={tp.dia}>
                  <View style={[tp.diaCirculo, programado ? tp.diaCirculoProgramado : tp.diaCirculoNoAplica, completado && tp.diaCirculoCompletado]} />
                  <Texto style={[tp.diaTexto, programado ? tp.diaTextoProgramado : tp.diaTextoNoAplica]}>{etiqueta}</Texto>
                </View>
              );
            })}
          </View>
        </View>
        <Boton color="#0D6238" disabled={cargando} iconoIzquierda={Play} onPress={onPressCta} style={tp.cta} variante="sendero">
          {cargando ? 'Guardando…' : ctaTexto}
        </Boton>
      </RecuadroGlass>
    </View>
  );
}

const tp = StyleSheet.create({
  contenedor: { marginTop: 12, position: 'relative' },
  raiz: { borderRadius: 28, minHeight: 390, overflow: 'hidden', padding: 20, position: 'relative', zIndex: 1 },
  arbol: { height: 298, opacity: .92, position: 'absolute', resizeMode: 'contain', right: -45, top: -5, width: 262, zIndex: 1 },
  iconoMarco: { alignSelf: 'flex-start', borderRadius: 18, elevation: 3, height: 68, marginTop: 3, padding: 2, position: 'relative', shadowColor: '#176836', shadowOffset: { height: 4, width: 3 }, shadowOpacity: .16, shadowRadius: 7, width: 68, zIndex: 2 },
  bordeIcono: { left: 0, position: 'absolute', top: 0 },
  iconoGlass: { alignItems: 'center', borderRadius: 16, flex: 1, justifyContent: 'center' },
  icono: { height: 48, resizeMode: 'contain', width: 48 },
  texto: { marginTop: 14, maxWidth: '60%', zIndex: 2 },
  titulo: { color: '#145C37', fontFamily: 'MontserratAlternates-Bold', fontSize: 29, lineHeight: 34 },
  metaObjetivo: { alignItems: 'center', flexDirection: 'row', gap: 7, marginTop: 8 },
  anilloMeta: { alignItems: 'center', height: 48, justifyContent: 'center', width: 48 },
  anilloSvg: { position: 'absolute' },
  anilloCero: { color: '#145C37', fontFamily: 'MontserratAlternates-Bold', fontSize: 13 },
  metaEtiqueta: { color: '#4A7F5D', fontFamily: 'Montserrat-Medium', fontSize: 10 },
  metaValor: { color: '#145C37', fontFamily: 'MontserratAlternates-Bold', fontSize: 13, marginTop: 1 },
  descripcion: { color: '#397250', fontFamily: 'Montserrat-Medium', fontSize: 12, lineHeight: 17, marginTop: 4 },
  metricas: { flexDirection: 'row', gap: 9, marginTop: 14, zIndex: 2 },
  metrica: { alignItems: 'center', backgroundColor: 'rgba(255,255,255,.58)', borderRadius: 14, flexDirection: 'row', gap: 5, paddingHorizontal: 10, paddingVertical: 8 },
  metricaTexto: { color: '#145C37', fontFamily: 'MontserratAlternates-Bold', fontSize: 11 },
  semana: { backgroundColor: 'rgba(255,255,255,.62)', borderRadius: 18, marginTop: 17, padding: 13, zIndex: 2 },
  semanaTitulo: { flexDirection: 'row', justifyContent: 'space-between' },
  semanaTexto: { color: '#145C37', fontFamily: 'MontserratAlternates-Bold', fontSize: 12 },
  dias: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 12 },
  dia: { alignItems: 'center', gap: 4 },
  diaCirculo: { borderRadius: 14, height: 27, width: 27 },
  diaCirculoProgramado: { backgroundColor: 'rgba(37,136,76,.25)', borderColor: 'rgba(37,136,76,.34)', borderWidth: 1 },
  diaCirculoNoAplica: { backgroundColor: 'rgba(90,128,105,.09)' },
  diaCirculoCompletado: { backgroundColor: '#25884C', borderColor: '#25884C' },
  diaTexto: { fontFamily: 'Montserrat-Medium', fontSize: 7 },
  diaTextoProgramado: { color: '#367651' },
  diaTextoNoAplica: { color: '#9BB2A1' },
  cta: { marginTop: 16, zIndex: 2 },
});
