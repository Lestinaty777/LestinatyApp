import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { ArrowLeft, Check, Crown, RefreshCw, Smartphone } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

import { MasterGlass, MasterIconBg, Texto } from '../../../diseno';
import { comprarHorizon, obtenerCatalogoHorizon, restaurarHorizon } from '../../../nucleo/compras/horizon';
import { CLAVE_HORIZON } from '../../../nucleo/compras/useHorizon';
import { useEscala } from '../../../diseno/tema/MasterColorContext';
import type { EscalaMaster } from '../../../diseno/tema/escalaEsmeralda';
import { capacidades } from '../../../plataforma/capacidades';
import { registrarEvento } from '../../../servicios/analitica/posthog';

// Dos sets de beneficios — Widgets (Android, hoy el único beneficio con
// preview visual) y Planes con Aby (todas las plataformas). Sin widgets en
// la plataforma (ej. iOS), no tiene sentido prometer un preview que no
// existe ahí — se muestra el set de Planes en su lugar.
const CLAVES_BENEFICIOS_WIDGETS = [
  { titulo: 'horizon.paywall.beneficios.b1Titulo', descripcion: 'horizon.paywall.beneficios.b1Desc' },
  { titulo: 'horizon.paywall.beneficios.b2Titulo', descripcion: 'horizon.paywall.beneficios.b2Desc' },
  { titulo: 'horizon.paywall.beneficios.b3Titulo', descripcion: 'horizon.paywall.beneficios.b3Desc' },
] as const;
const CLAVES_BENEFICIOS_PLANES = [
  { titulo: 'horizon.paywall.beneficiosPlanes.b1Titulo', descripcion: 'horizon.paywall.beneficiosPlanes.b1Desc' },
  { titulo: 'horizon.paywall.beneficiosPlanes.b2Titulo', descripcion: 'horizon.paywall.beneficiosPlanes.b2Desc' },
  { titulo: 'horizon.paywall.beneficiosPlanes.b3Titulo', descripcion: 'horizon.paywall.beneficiosPlanes.b3Desc' },
] as const;

export function HorizonPaywallPantalla({ volver }: { volver?: string }) {
  const { t } = useTranslation();
  const esc = useEscala();
  const s = useEstilosS();
  const router = useRouter();
  const cliente = useQueryClient();
  const paquetes = useQuery({ queryKey: ['compras', 'horizon', 'paquetes'], queryFn: obtenerCatalogoHorizon, staleTime: 30_000 });
  const [comprando, setComprando] = useState(false);
  const [restaurando, setRestaurando] = useState(false);
  const [aviso, setAviso] = useState<string | null>(null);
  useEffect(() => { registrarEvento('paywall_visto', { origen: volver ?? 'directo' }); }, [volver]);
  const paquete = paquetes.data?.estado === 'lista' ? (paquetes.data.paquetes[0] ?? null) : null;
  const beneficios = capacidades.widgets ? CLAVES_BENEFICIOS_WIDGETS : CLAVES_BENEFICIOS_PLANES;
  // `volver` es opcional y aditivo — sin él, el destino post-compra sigue
  // siendo exactamente el de siempre (Widgets de Hábitos), para no cambiar
  // el único flujo que ya usaba esta pantalla.
  const destinoPostCompra = volver ?? (capacidades.widgets ? '/habitos/widgets' : '/(principal)/hoy');

  async function actualizarAcceso() { await cliente.invalidateQueries({ queryKey: CLAVE_HORIZON }); }
  async function comprar() {
    if (!paquete || comprando) return;
    setAviso(null); setComprando(true);
    try {
      const resultado = await comprarHorizon(paquete.id);
      if (resultado.estado === 'completada') {
        await actualizarAcceso();
        router.replace(destinoPostCompra);
      } else if (resultado.estado === 'pendiente') {
        setAviso(t('horizon.paywall.avisoPendiente'));
      } else if (resultado.estado === 'error') {
        setAviso(t('horizon.paywall.avisoErrorCompra'));
      }
      // 'cancelada' no muestra aviso — el usuario decidió no continuar.
    } catch { setAviso(t('horizon.paywall.avisoErrorCompra')); } finally { setComprando(false); }
  }
  async function restaurar() {
    if (restaurando) return;
    setAviso(null); setRestaurando(true);
    try {
      const resultado = await restaurarHorizon();
      await actualizarAcceso();
      if (resultado.estado === 'restaurada' && resultado.horizonActivo) {
        router.replace(destinoPostCompra);
      } else if (resultado.estado === 'sin_compras' || resultado.estado === 'restaurada') {
        setAviso(t('horizon.paywall.avisoNoEncontrada'));
      } else {
        setAviso(t('horizon.paywall.avisoNoDisponible'));
      }
    } finally { setRestaurando(false); }
  }

  return <SafeAreaView edges={['top', 'bottom']} style={s.raiz}><ScrollView contentContainerStyle={s.contenido} showsVerticalScrollIndicator={false}>
    <Pressable accessibilityLabel={t('horizon.paywall.volver')} hitSlop={12} onPress={() => router.back()} style={s.volver}><ArrowLeft color={esc.jade.l34} size={23} strokeWidth={2.5} /></Pressable>
    <View style={s.hero}><MasterIconBg size={74}><Crown color={esc.jade.l42a} fill={esc.jade.l42a} size={34} /></MasterIconBg><Texto style={s.sobrelinea}>{t('horizon.paywall.sobrelinea')}</Texto><Texto style={s.titulo}>{t(capacidades.widgets ? 'horizon.paywall.titulo' : 'horizon.paywall.tituloPlanes')}</Texto><Texto style={s.subtitulo}>{t(capacidades.widgets ? 'horizon.paywall.subtitulo' : 'horizon.paywall.subtituloPlanes')}</Texto></View>
    {capacidades.widgets && <MasterGlass style={s.previa}><View style={s.previaCabecera}><Smartphone color={esc.jade.l42a} size={20} /><Texto style={s.previaTitulo}>{t('horizon.paywall.previaTitulo')}</Texto></View><View style={s.previaWidgets}><View style={s.widgetMini}><Texto style={s.widgetNumero}>2/4</Texto><Texto style={s.widgetTexto}>{t('horizon.paywall.habitosHoy')}</Texto></View><View style={s.widgetMini}><View style={s.anillo}><Check color="#FFFFFF" size={17} strokeWidth={3} /></View><Texto style={s.widgetTexto}>{t('horizon.paywall.registrar')}</Texto></View></View></MasterGlass>}
    <View style={s.beneficios}>{beneficios.map(({ titulo, descripcion }) => <MasterGlass key={titulo} style={s.beneficio}><View style={s.check}><Check color="#FFFFFF" size={15} strokeWidth={3} /></View><View style={s.beneficioTexto}><Texto style={s.beneficioTitulo}>{t(titulo)}</Texto><Texto style={s.beneficioDescripcion}>{t(descripcion)}</Texto></View></MasterGlass>)}</View>
    {paquetes.isLoading ? <ActivityIndicator color={esc.jade.l42a} style={s.cargando} /> : <Pressable accessibilityLabel={t('horizon.paywall.suscribirseAccesibilidad')} disabled={!paquete || comprando} onPress={() => void comprar()} style={[s.cta, (!paquete || comprando) && s.ctaDeshabilitado]}><Crown color="#FFFFFF" fill="#FFFFFF" size={19} /><Texto style={s.ctaTexto}>{comprando ? t('horizon.paywall.procesando') : (paquete ? t('horizon.paywall.ctaPrecio', { precio: paquete.precioTexto }) : t('horizon.paywall.cta'))}</Texto></Pressable>}
    {!paquetes.isLoading && !paquete && <Texto style={s.nota}>{t('horizon.paywall.noPaqueteNota')}</Texto>}
    {aviso && <Texto style={s.aviso}>{aviso}</Texto>}
    <Pressable accessibilityLabel={t('horizon.paywall.restaurar')} disabled={restaurando} onPress={() => void restaurar()} style={s.restaurar}><RefreshCw color={esc.jade.l42a} size={16} /><Texto style={s.restaurarTexto}>{restaurando ? t('horizon.paywall.restaurando') : t('horizon.paywall.restaurar')}</Texto></Pressable><Texto style={s.legal}>{t('horizon.paywall.legal')}</Texto>
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
