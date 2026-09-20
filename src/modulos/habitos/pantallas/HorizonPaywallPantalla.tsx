import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { ArrowLeft, Check, Crown, RefreshCw, Smartphone } from 'lucide-react-native';
import { useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { MasterGlass, MasterIconBg, Texto } from '../../../diseno';
import { comprarHorizon, obtenerPaquetesHorizon, restaurarHorizon } from '../../../nucleo/compras/horizon';
import { CLAVE_HORIZON } from '../../../nucleo/compras/useHorizon';
import { textoCtaHorizon } from './horizonCopy';
import { useEscala } from '../../../diseno/tema/MasterColorContext';
import type { EscalaMaster } from '../../../diseno/tema/escalaEsmeralda';

const BENEFICIOS = [
  ['Registra al instante', 'Un vistazo rápido para cuando los widgets estén disponibles.'],
  ['Tu progreso visible', 'Mantén el ritmo de hoy presente en tu inicio.'],
  ['Un hábito protagonista', 'Elige el hábito que quieres tener más cerca.'],
] as const;

export function HorizonPaywallPantalla() {
  const esc = useEscala();
  const s = useEstilosS();
  const router = useRouter();
  const cliente = useQueryClient();
  const paquetes = useQuery({ queryKey: ['compras', 'horizon', 'paquetes'], queryFn: obtenerPaquetesHorizon, staleTime: 30_000 });
  const [comprando, setComprando] = useState(false);
  const [restaurando, setRestaurando] = useState(false);
  const [aviso, setAviso] = useState<string | null>(null);
  const paquete = paquetes.data?.[0] ?? null;

  async function actualizarAcceso() { await cliente.invalidateQueries({ queryKey: CLAVE_HORIZON }); }
  async function comprar() {
    if (!paquete || comprando) return;
    setAviso(null); setComprando(true);
    try {
      const resultado = await comprarHorizon(paquete);
      if (resultado.exito) { await actualizarAcceso(); router.replace('/habitos/widgets'); }
    } catch { setAviso('No pudimos completar la compra. Inténtalo de nuevo.'); } finally { setComprando(false); }
  }
  async function restaurar() {
    if (restaurando) return;
    setAviso(null); setRestaurando(true);
    try {
      const estado = await restaurarHorizon();
      await actualizarAcceso();
      if (estado === 'activo') router.replace('/habitos/widgets');
      else setAviso(estado === 'noDisponible' ? 'Horizon aún no está disponible para esta app.' : 'No encontramos una suscripción Horizon para restaurar.');
    } finally { setRestaurando(false); }
  }

  return <SafeAreaView edges={['top', 'bottom']} style={s.raiz}><ScrollView contentContainerStyle={s.contenido} showsVerticalScrollIndicator={false}>
    <Pressable accessibilityLabel="Volver" hitSlop={12} onPress={() => router.back()} style={s.volver}><ArrowLeft color={esc.jade.l34} size={23} strokeWidth={2.5} /></Pressable>
    <View style={s.hero}><MasterIconBg size={74}><Crown color={esc.jade.l42a} fill={esc.jade.l42a} size={34} /></MasterIconBg><Texto style={s.sobrelinea}>LESTINATY HORIZON</Texto><Texto style={s.titulo}>Tus hábitos, siempre a la vista.</Texto><Texto style={s.subtitulo}>Una capa premium para llevar tu constancia contigo, incluso fuera de la app.</Texto></View>
    <MasterGlass style={s.previa}><View style={s.previaCabecera}><Smartphone color={esc.jade.l42a} size={20} /><Texto style={s.previaTitulo}>Próximamente en tu inicio</Texto></View><View style={s.previaWidgets}><View style={s.widgetMini}><Texto style={s.widgetNumero}>2/4</Texto><Texto style={s.widgetTexto}>hábitos hoy</Texto></View><View style={s.widgetMini}><View style={s.anillo}><Check color="#FFFFFF" size={17} strokeWidth={3} /></View><Texto style={s.widgetTexto}>Registrar</Texto></View></View></MasterGlass>
    <View style={s.beneficios}>{BENEFICIOS.map(([titulo, descripcion]) => <MasterGlass key={titulo} style={s.beneficio}><View style={s.check}><Check color="#FFFFFF" size={15} strokeWidth={3} /></View><View style={s.beneficioTexto}><Texto style={s.beneficioTitulo}>{titulo}</Texto><Texto style={s.beneficioDescripcion}>{descripcion}</Texto></View></MasterGlass>)}</View>
    {paquetes.isLoading ? <ActivityIndicator color={esc.jade.l42a} style={s.cargando} /> : <Pressable accessibilityLabel="Suscribirse a Lestinaty Horizon" disabled={!paquete || comprando} onPress={() => void comprar()} style={[s.cta, (!paquete || comprando) && s.ctaDeshabilitado]}><Crown color="#FFFFFF" fill="#FFFFFF" size={19} /><Texto style={s.ctaTexto}>{comprando ? 'Procesando…' : textoCtaHorizon(paquete)}</Texto></Pressable>}
    {!paquetes.isLoading && !paquete && <Texto style={s.nota}>La suscripción estará disponible muy pronto.</Texto>}
    {aviso && <Texto style={s.aviso}>{aviso}</Texto>}
    <Pressable disabled={restaurando} onPress={() => void restaurar()} style={s.restaurar}><RefreshCw color={esc.jade.l42a} size={16} /><Texto style={s.restaurarTexto}>{restaurando ? 'Restaurando…' : 'Restaurar compra'}</Texto></Pressable><Texto style={s.legal}>$129 MXN al mes. Cancela cuando quieras desde tu tienda.</Texto>
  </ScrollView></SafeAreaView>;
}

const crearEstilosS = (esc: EscalaMaster) => StyleSheet.create({
  raiz: { backgroundColor: esc.hoja.l95, flex: 1 }, contenido: { gap: 14, padding: 20, paddingBottom: 34 }, volver: { alignSelf: 'flex-start', padding: 6 }, hero: { alignItems: 'center', gap: 8, paddingHorizontal: 14 }, sobrelinea: { color: esc.jade.l53, fontFamily: 'MontserratAlternates-Bold', fontSize: 11, letterSpacing: 1.5 }, titulo: { color: esc.hoja.l22, fontFamily: 'Montserrat-Bold', fontSize: 30, lineHeight: 37, textAlign: 'center' }, subtitulo: { color: esc.musgo.l42, fontSize: 14, lineHeight: 21, textAlign: 'center' }, previa: { gap: 13, padding: 16 }, previaCabecera: { alignItems: 'center', flexDirection: 'row', gap: 8 }, previaTitulo: { color: esc.jade.l34a, fontFamily: 'MontserratAlternates-Bold', fontSize: 14 }, previaWidgets: { flexDirection: 'row', gap: 10 }, widgetMini: { alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.46)', borderRadius: 14, flex: 1, gap: 5, padding: 13 }, widgetNumero: { color: esc.jade.l34, fontFamily: 'Montserrat-Bold', fontSize: 22 }, widgetTexto: { color: esc.musgo.l50, fontFamily: 'MontserratAlternates-Medium', fontSize: 11 }, anillo: { alignItems: 'center', backgroundColor: esc.hoja.l56, borderRadius: 20, height: 32, justifyContent: 'center', width: 32 }, beneficios: { gap: 9 }, beneficio: { alignItems: 'center', flexDirection: 'row', gap: 12, padding: 14 }, check: { alignItems: 'center', backgroundColor: esc.hoja.l56, borderRadius: 12, height: 24, justifyContent: 'center', width: 24 }, beneficioTexto: { flex: 1 }, beneficioTitulo: { color: esc.hoja.l28, fontFamily: 'MontserratAlternates-Bold', fontSize: 14 }, beneficioDescripcion: { color: esc.musgo.l51, fontSize: 12, lineHeight: 18, marginTop: 2 }, cargando: { marginVertical: 9 }, cta: { alignItems: 'center', backgroundColor: esc.jade.l42a, borderRadius: 17, flexDirection: 'row', gap: 9, justifyContent: 'center', minHeight: 54, paddingHorizontal: 16, shadowColor: esc.jade.l29, shadowOffset: { height: 5, width: 0 }, shadowOpacity: 0.28, shadowRadius: 6 }, ctaDeshabilitado: { backgroundColor: esc.musgo.l66, shadowOpacity: 0 }, ctaTexto: { color: '#FFFFFF', fontFamily: 'MontserratAlternates-Bold', fontSize: 14 }, nota: { color: esc.musgo.l51, fontSize: 12, textAlign: 'center' }, aviso: { color: '#9A4C32', fontFamily: 'MontserratAlternates-Medium', fontSize: 12, textAlign: 'center' }, restaurar: { alignItems: 'center', alignSelf: 'center', flexDirection: 'row', gap: 6, minHeight: 36, paddingHorizontal: 10 }, restaurarTexto: { color: esc.jade.l42a, fontFamily: 'MontserratAlternates-Bold', fontSize: 12 }, legal: { color: esc.musgo.l58, fontSize: 11, lineHeight: 16, textAlign: 'center' },
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
