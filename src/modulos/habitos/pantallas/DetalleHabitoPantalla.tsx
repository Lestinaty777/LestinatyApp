import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { ChevronLeft, Sparkles } from 'lucide-react-native';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { RecuadroGlass, Texto } from '../../../diseno';
import { obtenerPanelHabitos, registrarProgresoHabito } from '../habitos.servicio';
import { crearModeloFilaHoy } from '../presentacion';

const C = { fondo: '#F3EEFA', texto: '#1A1335', tenue: '#7B7494', morado: '#7C3AED', barra: '#E7E1F1' };

export function DetalleHabitoPantalla({ id }: { id: string }) {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const cliente = useQueryClient();
  const consulta = useQuery({ queryKey: ['habitos', 'panel'], queryFn: () => obtenerPanelHabitos() });
  const habito = consulta.data?.hoy.datos.find((item) => item.id === id);
  const mutacion = useMutation({ mutationFn: registrarProgresoHabito, onSuccess: () => cliente.invalidateQueries({ queryKey: ['habitos', 'panel'] }) });

  if (consulta.isLoading) return <View style={[s.raiz, s.centro]}><Texto>Cargando hábito…</Texto></View>;
  if (!habito) return <View style={[s.raiz, { paddingTop: insets.top }]}><Pressable onPress={() => router.back()} style={s.back}><ChevronLeft color={C.texto} size={27} /></Pressable><Texto style={s.vacio}>Este hábito no está programado para hoy o ya no existe.</Texto></View>;
  const modelo = crearModeloFilaHoy(habito);
  const fechaLocal = new Date().toISOString().slice(0, 10);
  const siguienteValor = habito.tipoMeta === 'check' ? (habito.completado ? 0 : 1) : habito.valorHoy + 1;

  return <View style={[s.raiz, { paddingTop: insets.top }]}><ScrollView contentContainerStyle={[s.contenido, { paddingBottom: insets.bottom + 30 }]}>
    <View style={s.header}><Pressable onPress={() => router.back()} style={s.back}><ChevronLeft color={C.texto} size={27} /></Pressable><View><Texto style={s.hola}>Hola, Alejandro</Texto><Texto style={s.sub}>Tu hábito de hoy</Texto></View></View>
    <View style={s.heroReservado} />
    <RecuadroGlass style={s.cardPrincipal}><View style={[s.icono, { backgroundColor: `${habito.color}18` }]}><Sparkles color={habito.color} size={31} /></View><Texto style={s.titulo}>{habito.titulo}</Texto><Texto style={s.descripcion}>{habito.descripcion ?? 'Una acción pequeña que cuenta cada día.'}</Texto><Texto style={s.valor}>{modelo.texto}</Texto><View style={s.barraFondo}><View style={[s.barra, { backgroundColor: habito.color, width: `${modelo.progreso}%` }]} /></View><Pressable disabled={mutacion.isPending} onPress={() => mutacion.mutate({ habitoId: habito.id, fechaLocal, valor: siguienteValor })} style={s.accion}><Texto style={s.accionTexto}>{mutacion.isPending ? 'Guardando…' : 'Registrar progreso'}</Texto></Pressable>{mutacion.isError && <Texto style={s.error}>No pudimos guardar el progreso. Inténtalo de nuevo.</Texto>}</RecuadroGlass>
    <RecuadroGlass style={s.metricas}><Texto style={s.metricasTitulo}>Tu progreso</Texto><Texto style={s.metricaTexto}>Hoy llevas {modelo.progreso}% de tu meta.</Texto></RecuadroGlass>
  </ScrollView></View>;
}

const s = StyleSheet.create({ raiz: { flex: 1, backgroundColor: C.fondo }, centro: { alignItems: 'center', justifyContent: 'center' }, contenido: { gap: 16, paddingHorizontal: 16 }, header: { alignItems: 'center', flexDirection: 'row', gap: 7, paddingTop: 8 }, back: { padding: 8 }, hola: { color: C.texto, fontFamily: 'Montserrat-Bold', fontSize: 17 }, sub: { color: C.tenue, fontSize: 12 }, heroReservado: { height: 100 }, cardPrincipal: { alignItems: 'center', borderRadius: 23, padding: 20 }, icono: { alignItems: 'center', borderRadius: 18, height: 64, justifyContent: 'center', width: 64 }, titulo: { color: C.texto, fontFamily: 'Montserrat-Bold', fontSize: 25, marginTop: 10 }, descripcion: { color: C.tenue, fontSize: 13, marginTop: 3, textAlign: 'center' }, valor: { color: C.texto, fontFamily: 'Montserrat-Bold', fontSize: 20, marginTop: 22 }, barraFondo: { backgroundColor: C.barra, borderRadius: 9, height: 8, marginTop: 8, overflow: 'hidden', width: '100%' }, barra: { borderRadius: 9, height: '100%' }, accion: { alignItems: 'center', backgroundColor: C.morado, borderRadius: 16, marginTop: 18, paddingVertical: 13, width: '100%' }, accionTexto: { color: '#FFFFFF', fontFamily: 'Montserrat-Bold', fontSize: 15 }, error: { color: '#DC2626', marginTop: 10, textAlign: 'center' }, metricas: { borderRadius: 19, padding: 16 }, metricasTitulo: { color: C.texto, fontFamily: 'Montserrat-Bold', fontSize: 17 }, metricaTexto: { color: C.tenue, fontSize: 13, marginTop: 3 }, vacio: { color: C.tenue, padding: 24, textAlign: 'center' } });
