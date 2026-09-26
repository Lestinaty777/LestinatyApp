import type { ImageSourcePropType } from 'react-native';
import { Image, StyleSheet, View } from 'react-native';
import { Play } from 'lucide-react-native';
import Svg, { Circle } from 'react-native-svg';

import { Boton, MasterIcon, MasterIconBg, RecuadroGlass, Texto, useTonoMaster } from '../../../diseno';
import type { AssetsPaqueteHabito } from '../paqueteVisual.assets';
import { useEscala } from '../../../diseno/tema/MasterColorContext';
import type { EscalaMaster } from '../../../diseno/tema/escalaEsmeralda';
import { conAlfa } from '../../../diseno/tema/masterColor';

const DIAS_SEMANA_ETIQUETA = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
const RADIO_ANILLO = 19;
const CIRCUNFERENCIA_ANILLO = 2 * Math.PI * RADIO_ANILLO;

export type TarjetaSenderoHabitoProps = {
  assets: AssetsPaqueteHabito;
  cargando?: boolean;
  ctaTexto?: string;
  descripcion?: string;
  deshabilitado?: boolean;
  diasCompletados?: number[];
  diasProgramados: number[];
  escalaArbol?: number;
  icono: { fuente: ImageSourcePropType; hue?: number };
  meta: number;
  metaEtiqueta: string;
  nivel?: number;
  onPressCta?: () => void;
  puedeRegistrarHoy?: boolean;
  racha?: number;
  titulo: string;
  valorHoy?: number;
};

// Tarjeta rica de hábito: nace en el paso "Tu hábito está listo" del wizard de
// creación (como previsualización, sin datos reales) y es la misma que se usa
// en HabitosPantalla con datos reales — un solo componente, dos contextos.
export function TarjetaSenderoHabito({
  assets, cargando = false, ctaTexto = 'Comenzar', descripcion = '', deshabilitado, diasCompletados = [], diasProgramados,
  escalaArbol = 1, icono, meta, metaEtiqueta, nivel = 1, onPressCta, puedeRegistrarHoy = true, racha = 0, titulo, valorHoy = 0,
}: TarjetaSenderoHabitoProps) {
  const tp = useEstilosTp();
  // Colores del tono activo (Esmeralda fuera de un MasterColorProvider = los verdes de siempre).
  const tono = useTonoMaster();
  const c = tono.tarjeta;
  const fraccionProgreso = Math.max(0.06, meta > 0 ? Math.min(1, valorHoy / meta) : 0.06);
  const offsetAnillo = CIRCUNFERENCIA_ANILLO * (1 - fraccionProgreso);

  return (
    <View style={tp.contenedor}>
      <RecuadroGlass blur degradado={tono.degradadoTarjeta} style={tp.raiz}>
        <Image source={assets.arbolPrincipal} style={[tp.arbol, { transform: [{ scale: escalaArbol }] }]} />
        <MasterIconBg fuente={icono.fuente} hue={icono.hue} style={tp.iconoMarco} />
        <View style={tp.texto}>
          <Texto style={[tp.titulo, { color: c.tinta }]}>{titulo || 'Mi hábito'}</Texto>
          <View style={tp.metaObjetivo}>
            <View style={tp.anilloMeta}>
              <Svg height={48} style={tp.anilloSvg} width={48}>
                <Circle cx="24" cy="24" fill="none" r={RADIO_ANILLO} stroke={`${c.tinta}2B`} strokeWidth={4} />
                <Circle cx="24" cy="24" fill="none" r={RADIO_ANILLO} rotation="-90" stroke={c.trazo} strokeDasharray={`${CIRCUNFERENCIA_ANILLO} ${CIRCUNFERENCIA_ANILLO}`} strokeDashoffset={offsetAnillo} strokeLinecap="round" strokeWidth={4} origin="24,24" />
              </Svg>
              <Texto style={[tp.anilloCero, { color: c.tinta }]}>{valorHoy}</Texto>
            </View>
            <View>
              <Texto style={[tp.metaEtiqueta, { color: c.tintaMedia }]}>Meta de hoy</Texto>
              <Texto style={[tp.metaValor, { color: c.tinta }]}>{valorHoy}/{metaEtiqueta}</Texto>
            </View>
          </View>
          {Boolean(descripcion.trim()) && <Texto numberOfLines={2} style={[tp.descripcion, { color: c.tintaSuave }]}>{descripcion.trim()}</Texto>}
        </View>
        <View style={tp.metricas}>
          <View style={tp.metrica}><MasterIcon alTema name="racha" size={25} /><Texto style={[tp.metricaTexto, { color: c.tinta }]}>{racha} días</Texto></View>
          <View style={tp.metrica}><MasterIcon alTema name={`nivel${nivel}`} size={25} /><Texto style={[tp.metricaTexto, { color: c.tinta }]}>Nivel {nivel}</Texto></View>
        </View>
        <View style={tp.semana}>
          <View style={tp.semanaTitulo}>
            <Texto style={[tp.semanaTexto, { color: c.tinta }]}>Esta semana</Texto>
            <Texto style={[tp.semanaTexto, { color: c.tinta }]}>{diasCompletados.length}/{diasProgramados.length}</Texto>
          </View>
          <View style={tp.dias}>
            {DIAS_SEMANA_ETIQUETA.map((etiqueta, indice) => {
              const idDia = indice + 1;
              const programado = diasProgramados.includes(idDia);
              const completado = diasCompletados.includes(idDia);
              return (
                <View key={idDia} style={tp.dia}>
                  <View style={[tp.diaCirculo, programado ? [tp.diaCirculoProgramado, { backgroundColor: `${c.trazo}40`, borderColor: `${c.trazo}57` }] : tp.diaCirculoNoAplica, completado && [tp.diaCirculoCompletado, { backgroundColor: c.trazo, borderColor: c.trazo }]]} />
                  <Texto style={[tp.diaTexto, programado ? [tp.diaTextoProgramado, { color: c.tintaDia }] : tp.diaTextoNoAplica]}>{etiqueta}</Texto>
                </View>
              );
            })}
          </View>
        </View>
        <Boton
          color={c.boton}
          disabled={cargando || deshabilitado === true || !puedeRegistrarHoy}
          iconoIzquierda={Play}
          onPress={cargando || deshabilitado === true || !puedeRegistrarHoy ? undefined : onPressCta}
          style={tp.cta}
          variante="sendero"
        >
          {cargando ? 'Guardando…' : ctaTexto}
        </Boton>
      </RecuadroGlass>
    </View>
  );
}

const crearEstilosTp = (esc: EscalaMaster) => StyleSheet.create({
  contenedor: { marginTop: 12, position: 'relative' },
  raiz: { borderRadius: 28, minHeight: 390, overflow: 'hidden', padding: 20, position: 'relative', zIndex: 1 },
  arbol: { height: 298, opacity: .92, position: 'absolute', resizeMode: 'contain', right: -45, top: -5, width: 262, zIndex: 1 },
  iconoMarco: { marginTop: 3, zIndex: 2 },
  texto: { marginTop: 14, maxWidth: '60%', zIndex: 2 },
  titulo: { color: esc.jade.l34, fontFamily: 'MontserratAlternates-Bold', fontSize: 29, lineHeight: 34 },
  metaObjetivo: { alignItems: 'center', flexDirection: 'row', gap: 7, marginTop: 8 },
  anilloMeta: { alignItems: 'center', height: 48, justifyContent: 'center', width: 48 },
  anilloSvg: { position: 'absolute' },
  anilloCero: { color: esc.jade.l34, fontFamily: 'MontserratAlternates-Bold', fontSize: 13 },
  metaEtiqueta: { color: esc.musgo.l49, fontFamily: 'Montserrat-Medium', fontSize: 12 },
  metaValor: { color: esc.jade.l34, fontFamily: 'MontserratAlternates-Bold', fontSize: 13, marginTop: 1 },
  descripcion: { color: esc.jade.l43, fontFamily: 'Montserrat-Medium', fontSize: 12, lineHeight: 17, marginTop: 4 },
  metricas: { flexDirection: 'row', gap: 9, marginTop: 14, zIndex: 2 },
  metrica: { alignItems: 'center', backgroundColor: 'rgba(255,255,255,.58)', borderRadius: 14, flexDirection: 'row', gap: 5, paddingHorizontal: 10, paddingVertical: 8 },
  metricaTexto: { color: esc.jade.l34, fontFamily: 'MontserratAlternates-Bold', fontSize: 12 },
  semana: { backgroundColor: 'rgba(255,255,255,.62)', borderRadius: 18, marginTop: 17, padding: 13, zIndex: 2 },
  semanaTitulo: { flexDirection: 'row', justifyContent: 'space-between' },
  semanaTexto: { color: esc.jade.l34, fontFamily: 'MontserratAlternates-Bold', fontSize: 12 },
  dias: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 12 },
  dia: { alignItems: 'center', gap: 4 },
  diaCirculo: { borderRadius: 14, height: 27, width: 27 },
  diaCirculoProgramado: { backgroundColor: conAlfa(esc.jade.l50, .25), borderColor: conAlfa(esc.jade.l50, .34), borderWidth: 1 },
  diaCirculoNoAplica: { backgroundColor: conAlfa(esc.musgo.l50, .09) },
  diaCirculoCompletado: { backgroundColor: esc.jade.l50, borderColor: esc.jade.l50 },
  diaTexto: { fontFamily: 'Montserrat-Medium', fontSize: 11 },
  diaTextoProgramado: { color: esc.jade.l45 },
  diaTextoNoAplica: { color: esc.musgo.l70 },
  cta: { marginTop: 16, zIndex: 2 },
});

const estilosPorEscalaTp = new WeakMap<EscalaMaster, ReturnType<typeof crearEstilosTp>>();

function useEstilosTp() {
  const esc = useEscala();
  let valor = estilosPorEscalaTp.get(esc);
  if (!valor) {
    valor = crearEstilosTp(esc);
    estilosPorEscalaTp.set(esc, valor);
  }
  return valor;
}
