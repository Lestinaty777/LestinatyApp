import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { BarChart3, ChevronLeft, Heart, Leaf, Link2, TriangleAlert } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

import { RecuadroGlass, TabChanger, Texto } from '../../../diseno';
import { obtenerPanelHabitos } from '../habitos.servicio';
import { accesosCategoriasHabitos } from '../presentacion';
import { CategoriaHabitosId } from '../tipos';
import { ESCALA_ESMERALDA } from '../../../diseno/tema/escalaEsmeralda';

const C = { fondo: '#F3EEFA', texto: '#1A1335', tenue: '#7B7494', morado: '#7C3AED', verde: ESCALA_ESMERALDA.jade.l70 };
const iconos = { hoy: Leaf, patrones: BarChart3, conexiones: Link2, riesgo: TriangleAlert, impacto: Heart } as const;

const CLAVES_ETIQUETAS: Record<CategoriaHabitosId, string> = {
  hoy: 'habitos.categorias.etiquetas.hoy',
  patrones: 'habitos.categorias.etiquetas.patrones',
  conexiones: 'habitos.categorias.etiquetas.conexiones',
  riesgo: 'habitos.categorias.etiquetas.riesgo',
  impacto: 'habitos.categorias.etiquetas.impacto',
};

const CLAVES_SUBTITULOS: Record<CategoriaHabitosId, string> = {
  hoy: 'habitos.categorias.subtitulos.hoy',
  patrones: 'habitos.categorias.subtitulos.patrones',
  conexiones: 'habitos.categorias.subtitulos.conexiones',
  riesgo: 'habitos.categorias.subtitulos.riesgo',
  impacto: 'habitos.categorias.subtitulos.impacto',
};

export function CategoriaHabitosPantalla({ categoria }: { categoria: CategoriaHabitosId }) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [vista, setVista] = useState<0 | 1>(0);
  const consulta = useQuery({ queryKey: ['habitos', 'panel'], queryFn: () => obtenerPanelHabitos() });
  const panel = consulta.data;
  const datos = panel?.[categoria].datos ?? [];
  const estado = panel?.[categoria].estado;
  const Icono = iconos[categoria];

  return <View style={[s.raiz, { paddingTop: insets.top }]}><ScrollView contentContainerStyle={[s.contenido, { paddingBottom: insets.bottom + 32 }]}>
    <View style={s.header}><Pressable accessibilityLabel={t('habitos.categoriaPantalla.volver')} accessibilityRole="button" onPress={() => router.back()} style={s.back}><ChevronLeft color={C.texto} size={26} /></Pressable><View style={s.headerTexto}><View style={s.tituloFila}><Icono color={C.morado} size={28} /><Texto style={s.titulo}>{t(CLAVES_ETIQUETAS[categoria])}</Texto></View><Texto style={s.subtitulo}>{t(CLAVES_SUBTITULOS[categoria])}</Texto></View></View>
    <TabChanger tabs={[t('habitos.categoriaPantalla.tabs.categorias'), t('habitos.categoriaPantalla.tabs.habitos')]} value={vista} onTabChange={(indice) => setVista(indice as 0 | 1)} />
    {consulta.isLoading && <Texto style={s.estado}>{t('habitos.categoriaPantalla.cargando')}</Texto>}
    {consulta.isError && <Pressable accessibilityLabel={t('habitos.categoriaPantalla.reintentar')} accessibilityRole="button" onPress={() => consulta.refetch()}><Texto style={s.error}>{t('habitos.categoriaPantalla.error')}</Texto></Pressable>}
    {!consulta.isLoading && !consulta.isError && vista === 0 && <>
      <View style={s.grid}>{accesosCategoriasHabitos.map(({ id }) => { const AccesoIcono = iconos[id]; return <Pressable key={id} accessibilityLabel={t(CLAVES_ETIQUETAS[id])} accessibilityRole="button" accessibilityState={{ selected: id === categoria }} onPress={() => router.replace(`/habitos/categoria/${id}`)} style={s.cardPresionable}><RecuadroGlass style={[s.cardCategoria, id === categoria && s.cardActiva]}><AccesoIcono color={id === categoria ? C.verde : C.morado} size={25} /><Texto style={s.etiquetaCard}>{t(CLAVES_ETIQUETAS[id])}</Texto></RecuadroGlass></Pressable>; })}</View>
      <RecuadroGlass style={s.detalle}><Texto style={s.detalleTitulo}>{t(CLAVES_ETIQUETAS[categoria])}</Texto>{estado !== 'listo' && <Texto style={s.estado}>{t('habitos.categoriaPantalla.reuniendo')}</Texto>}{estado === 'listo' && <DatosCategoria categoria={categoria} datos={datos as Record<string, unknown>[]} t={t} />}</RecuadroGlass>
    </>}
    {!consulta.isLoading && !consulta.isError && vista === 1 && <View style={s.lista}>{(panel?.hoy.datos ?? []).map((habito) => <Pressable key={habito.id} accessibilityLabel={t('habitos.categoriaPantalla.verHabito', { titulo: habito.titulo })} accessibilityRole="button" onPress={() => router.push(`/habitos/${habito.id}`)}><RecuadroGlass style={s.filaHabito}><Leaf color={habito.color} size={23} /><View style={s.flex}><Texto style={s.habitoTitulo}>{habito.titulo}</Texto><Texto style={s.habitoMeta}>{habito.valorHoy}/{habito.meta} {habito.unidad ?? ''}</Texto></View></RecuadroGlass></Pressable>)}</View>}
  </ScrollView></View>;
}

function DatosCategoria({ categoria, datos, t }: { categoria: CategoriaHabitosId; datos: Record<string, unknown>[]; t: (key: string, opts?: any) => string }) {
  if (!datos.length) return <Texto style={s.estado}>{t('habitos.categoriaPantalla.noResultados')}</Texto>;
  return <View style={s.lista}>{datos.map((dato, indice) => <View key={`${categoria}-${indice}`} style={s.dato}><Texto style={s.datoPrimario}>{textoPrimario(categoria, dato, t)}</Texto><Texto style={s.datoSecundario}>{textoSecundario(categoria, dato, t)}</Texto></View>)}</View>;
}
function textoPrimario(categoria: CategoriaHabitosId, dato: Record<string, unknown>, t: (key: string, opts?: any) => string) { if (categoria === 'patrones') return t('habitos.categoriaPantalla.patronPrimario', { dia: dato.diaSemana, porcentaje: dato.porcentaje }); if (categoria === 'riesgo') return String(dato.titulo); if (categoria === 'conexiones') return t('habitos.categoriaPantalla.conexionesPrimario', { origen: String(dato.origenHabitoId), destino: String(dato.destinoHabitoId) }); if (categoria === 'impacto') return t('habitos.categoriaPantalla.impactoPrimario', { origen: String(dato.origenHabitoId), destino: String(dato.destinoHabitoId) }); return String(dato.titulo ?? t('habitos.categoriaPantalla.habitoPorDefecto')); }
function textoSecundario(categoria: CategoriaHabitosId, dato: Record<string, unknown>, t: (key: string, opts?: any) => string) { if (categoria === 'patrones') return t('habitos.categoriaPantalla.patronSecundario', { completados: dato.completados, muestras: dato.muestras }); if (categoria === 'riesgo') return t('habitos.categoriaPantalla.riesgoSecundario', { reciente: dato.reciente, base: dato.base }); if (categoria === 'conexiones') return t('habitos.categoriaPantalla.conexionesSecundario', { fuerza: dato.fuerza }); if (categoria === 'impacto') return t('habitos.categoriaPantalla.impactoSecundario', { impacto: dato.impacto }); return ''; }

const s = StyleSheet.create({ raiz: { flex: 1, backgroundColor: C.fondo }, contenido: { gap: 16, paddingHorizontal: 16 }, header: { alignItems: 'center', flexDirection: 'row', paddingTop: 9 }, back: { padding: 8 }, headerTexto: { flex: 1, paddingLeft: 5 }, tituloFila: { alignItems: 'center', flexDirection: 'row', gap: 9 }, titulo: { color: C.texto, fontFamily: 'Montserrat-Bold', fontSize: 25, lineHeight: 30 }, subtitulo: { color: C.tenue, fontSize: 13, marginTop: 3 }, grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 9 }, cardPresionable: { width: '31%' }, cardCategoria: { alignItems: 'center', borderRadius: 16, gap: 5, minHeight: 82, justifyContent: 'center', padding: 8 }, cardActiva: { borderColor: C.verde, borderWidth: 1.5 }, etiquetaCard: { color: C.texto, fontFamily: 'Montserrat-Bold', fontSize: 11, textAlign: 'center' }, detalle: { borderRadius: 20, padding: 16 }, detalleTitulo: { color: C.texto, fontFamily: 'Montserrat-Bold', fontSize: 18 }, estado: { color: C.tenue, paddingVertical: 18, textAlign: 'center' }, error: { color: '#DC2626', paddingVertical: 18, textAlign: 'center' }, lista: { gap: 8, marginTop: 9 }, dato: { borderBottomColor: 'rgba(124,58,237,.12)', borderBottomWidth: StyleSheet.hairlineWidth, paddingVertical: 10 }, datoPrimario: { color: C.texto, fontFamily: 'Montserrat-Bold', fontSize: 14 }, datoSecundario: { color: C.tenue, fontSize: 12, marginTop: 2 }, filaHabito: { alignItems: 'center', borderRadius: 16, flexDirection: 'row', gap: 11, padding: 14 }, flex: { flex: 1 }, habitoTitulo: { color: C.texto, fontFamily: 'Montserrat-Bold', fontSize: 15 }, habitoMeta: { color: C.tenue, fontSize: 12 } });
