import { useRouter } from 'expo-router';
import { ChevronRight, Smartphone } from 'lucide-react-native';
import { Pressable, StyleSheet, View } from 'react-native';

import { MasterGlass, MasterIconBg, Texto } from '../../../diseno';
import { rutaParaHorizon } from '../../../nucleo/compras/horizonAcceso';
import { useHorizon } from '../../../nucleo/compras/useHorizon';
import { useEscala } from '../../../diseno/tema/MasterColorContext';
import type { EscalaMaster } from '../../../diseno/tema/escalaEsmeralda';

export function HorizonTipRecordatorios() {
  const esc = useEscala();
  const s = useEstilosS();
  const router = useRouter();
  const horizon = useHorizon();
  const cargando = horizon.isLoading;
  return <Pressable accessibilityLabel="Explorar widgets Horizon" disabled={cargando} onPress={() => router.push(rutaParaHorizon(horizon.data ?? 'noDisponible'))} style={s.presionable}>
    <MasterGlass style={s.tarjeta}>
      <MasterIconBg size={46}><Smartphone color={esc.jade.l42a} size={21} /></MasterIconBg>
      <View style={s.texto}><Texto style={s.titulo}>Lleva tus hábitos a tu inicio</Texto><Texto style={s.descripcion}>{cargando ? 'Comprobando Horizon…' : 'Explora la experiencia Horizon para tus widgets.'}</Texto></View>
      <ChevronRight color={esc.hoja.l56} size={20} />
    </MasterGlass>
  </Pressable>;
}

const crearEstilosS = (esc: EscalaMaster) => StyleSheet.create({
  presionable: { marginTop: 4 }, tarjeta: { alignItems: 'center', borderRadius: 18, flexDirection: 'row', gap: 11, padding: 12 }, texto: { flex: 1 }, titulo: { color: esc.jade.l34a, fontFamily: 'MontserratAlternates-Bold', fontSize: 13 }, descripcion: { color: esc.musgo.l51, fontSize: 11, lineHeight: 15, marginTop: 2 },
});

const estilosPorEscalaS = new WeakMap<EscalaMaster, ReturnType<typeof crearEstilosS>>();

function useEstilosS() {
  const esc = useEscala();
  let valor = estilosPorEscalaS.get(esc);
  if (!valor) {
    valor = crearEstilosS(esc);
    estilosPorEscalaS.set(esc, valor);
  }
  return valor;
}
