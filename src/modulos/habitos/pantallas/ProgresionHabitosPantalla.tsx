import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { ChevronLeft, TrendingUp } from 'lucide-react-native';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Texto } from '../../../diseno';
import { ListaProgresionHabitos } from '../componentes/ListaProgresionHabitos';
import { obtenerResumenPlanesHabitos } from '../habitos.servicio';

const C = { fondo: '#F3EEFA', texto: '#1A1335', tenue: '#7B7494', morado: '#7C3AED' };

// Ruta standalone (deep-link) de Progresión — la vista incrustada vive en
// HabitosPantalla y reusa ListaProgresionHabitos con los mismos datos.
export function ProgresionHabitosPantalla() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const consulta = useQuery({ queryKey: ['habitos', 'progresion'], queryFn: () => obtenerResumenPlanesHabitos() });

  return <View style={[s.raiz, { paddingTop: insets.top }]}><ScrollView contentContainerStyle={[s.contenido, { paddingBottom: insets.bottom + 32 }]}>
    <View style={s.header}>
      <Pressable onPress={() => router.back()} style={s.back}><ChevronLeft color={C.texto} size={26} /></Pressable>
      <View style={s.headerTexto}><View style={s.tituloFila}><TrendingUp color={C.morado} size={26} /><Texto style={s.titulo}>Progresión</Texto></View><Texto style={s.subtitulo}>El nivel de cada hábito, de un vistazo.</Texto></View>
    </View>
    <ListaProgresionHabitos
      isError={consulta.isError}
      isLoading={consulta.isLoading}
      onReintentar={() => consulta.refetch()}
      onSeleccionar={(id) => router.push(`/habitos/${id}`)}
      planes={consulta.data ?? []}
    />
  </ScrollView></View>;
}

const s = StyleSheet.create({
  raiz: { backgroundColor: C.fondo, flex: 1 },
  contenido: { gap: 10, paddingHorizontal: 16 },
  header: { alignItems: 'center', flexDirection: 'row', marginBottom: 4, paddingTop: 9 },
  back: { padding: 8 },
  headerTexto: { flex: 1, paddingLeft: 5 },
  tituloFila: { alignItems: 'center', flexDirection: 'row', gap: 9 },
  titulo: { color: C.texto, fontFamily: 'Montserrat-Bold', fontSize: 25 },
  subtitulo: { color: C.tenue, fontSize: 13, marginTop: 3 },
});
