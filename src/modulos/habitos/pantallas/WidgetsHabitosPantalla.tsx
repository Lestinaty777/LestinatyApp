import { useRouter } from 'expo-router';
import { ArrowLeft, Check, Clock3, Smartphone, Sparkles } from 'lucide-react-native';
import type { ReactNode } from 'react';
import { useEffect } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { MasterGlass, MasterIconBg, MasterProgressbar, Texto } from '../../../diseno';
import { useHorizon } from '../../../nucleo/compras/useHorizon';

export function WidgetsHabitosPantalla() {
  const router = useRouter();
  const horizon = useHorizon();
  useEffect(() => { if (!horizon.isLoading && horizon.data !== 'activo') router.replace('/horizon'); }, [horizon.data, horizon.isLoading, router]);
  if (horizon.isLoading || horizon.data !== 'activo') return <SafeAreaView edges={['top']} style={s.raiz}><ActivityIndicator color="#287A45" style={s.cargando} /></SafeAreaView>;
  return <SafeAreaView edges={['top', 'bottom']} style={s.raiz}><ScrollView contentContainerStyle={s.contenido} showsVerticalScrollIndicator={false}>
    <View style={s.header}><Pressable accessibilityLabel="Volver" hitSlop={12} onPress={() => router.back()} style={s.volver}><ArrowLeft color="#24633A" size={23} strokeWidth={2.5} /></Pressable><View style={s.headerTexto}><Texto style={s.sobrelinea}>LESTINATY HORIZON</Texto><Texto style={s.titulo}>Tus widgets</Texto></View></View>
    <Texto style={s.subtitulo}>Elige cómo se verán tus hábitos cuando lleguen a tu pantalla de inicio.</Texto>
    <VistaPrevia icono={<Check color="#FFFFFF" size={20} strokeWidth={3} />} titulo="Registro rápido" subtitulo="Marca tu hábito con un toque."><View style={s.registro}><View style={s.circulo}><Check color="#FFFFFF" size={21} strokeWidth={3} /></View><View><Texto style={s.habito}>Tomar agua</Texto><Texto style={s.meta}>0 de 8 vasos</Texto></View></View></VistaPrevia>
    <VistaPrevia icono={<Clock3 color="#FFFFFF" size={19} strokeWidth={2.7} />} titulo="Progreso de hoy" subtitulo="Tu constancia diaria de un vistazo."><View style={s.progreso}><View style={s.progresoFila}><Texto style={s.habito}>Hábitos hoy</Texto><Texto style={s.porcentaje}>50%</Texto></View><MasterProgressbar altura={11} porcentaje={50} /></View></VistaPrevia>
    <VistaPrevia icono={<Sparkles color="#FFFFFF" fill="#FFFFFF" size={18} />} titulo="Hábito destacado" subtitulo="Dale foco a lo que más importa."><View style={s.destacado}><MasterIconBg size={44}><Sparkles color="#287A45" fill="#287A45" size={20} /></MasterIconBg><View><Texto style={s.habito}>Leer 20 minutos</Texto><Texto style={s.meta}>Tu foco de hoy</Texto></View></View></VistaPrevia>
    <MasterGlass style={s.aviso}><Smartphone color="#287A45" size={19} /><Texto style={s.avisoTexto}>Los widgets para tu inicio llegarán pronto.</Texto></MasterGlass>
  </ScrollView></SafeAreaView>;
}

function VistaPrevia({ children, icono, subtitulo, titulo }: { children: ReactNode; icono: ReactNode; subtitulo: string; titulo: string }) {
  return <MasterGlass style={s.tarjeta}><View style={s.tarjetaCabecera}><View style={s.icono}>{icono}</View><View style={s.tarjetaTexto}><Texto style={s.tarjetaTitulo}>{titulo}</Texto><Texto style={s.tarjetaSubtitulo}>{subtitulo}</Texto></View><Texto style={s.preview}>VISTA PREVIA</Texto></View><View style={s.muestra}>{children}</View></MasterGlass>;
}

const s = StyleSheet.create({
  raiz: { backgroundColor: '#E8F7E9', flex: 1 }, contenido: { gap: 13, padding: 20, paddingBottom: 34 }, cargando: { flex: 1 }, header: { alignItems: 'center', flexDirection: 'row', gap: 7 }, volver: { padding: 6 }, headerTexto: { flex: 1 }, sobrelinea: { color: '#3D8D55', fontFamily: 'MontserratAlternates-Bold', fontSize: 10, letterSpacing: 1.3 }, titulo: { color: '#173D24', fontFamily: 'Montserrat-Bold', fontSize: 27, lineHeight: 34 }, subtitulo: { color: '#587763', fontSize: 13, lineHeight: 19, marginBottom: 4 }, tarjeta: { gap: 15, padding: 15 }, tarjetaCabecera: { alignItems: 'center', flexDirection: 'row', gap: 10 }, icono: { alignItems: 'center', backgroundColor: '#3B9858', borderRadius: 13, height: 29, justifyContent: 'center', width: 29 }, tarjetaTexto: { flex: 1 }, tarjetaTitulo: { color: '#214B2D', fontFamily: 'MontserratAlternates-Bold', fontSize: 15 }, tarjetaSubtitulo: { color: '#688574', fontSize: 11, marginTop: 1 }, preview: { color: '#5B9870', fontFamily: 'MontserratAlternates-Bold', fontSize: 8, letterSpacing: 0.8 }, muestra: { backgroundColor: 'rgba(255,255,255,0.43)', borderRadius: 16, padding: 15 }, registro: { alignItems: 'center', flexDirection: 'row', gap: 12 }, circulo: { alignItems: 'center', backgroundColor: '#3B9858', borderRadius: 22, height: 39, justifyContent: 'center', width: 39 }, habito: { color: '#285337', fontFamily: 'MontserratAlternates-Bold', fontSize: 14 }, meta: { color: '#6C8977', fontSize: 11, marginTop: 2 }, progreso: { gap: 8 }, progresoFila: { flexDirection: 'row', justifyContent: 'space-between' }, porcentaje: { color: '#287A45', fontFamily: 'MontserratAlternates-Bold', fontSize: 13 }, destacado: { alignItems: 'center', flexDirection: 'row', gap: 11 }, aviso: { alignItems: 'center', flexDirection: 'row', gap: 10, padding: 14 }, avisoTexto: { color: '#3F6750', flex: 1, fontFamily: 'MontserratAlternates-Medium', fontSize: 12, lineHeight: 18 },
});
