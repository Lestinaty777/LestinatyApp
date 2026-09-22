import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { Bell, ChevronLeft } from 'lucide-react-native';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

import { Texto } from '../../../diseno';
import { ListaRecordatoriosHabitos } from '../componentes/ListaRecordatoriosHabitos';
import { obtenerResumenPlanesHabitos } from '../habitos.servicio';

const C = { fondo: '#F3EEFA', texto: '#1A1335', tenue: '#7B7494', morado: '#7C3AED' };

// Ruta standalone (deep-link) de Recordatorios — la vista incrustada vive en
// HabitosPantalla y reusa ListaRecordatoriosHabitos con los mismos datos.
export function RecordatoriosHabitosPantalla() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const consulta = useQuery({ queryKey: ['habitos', 'recordatorios'], queryFn: () => obtenerResumenPlanesHabitos() });

  return <View style={[s.raiz, { paddingTop: insets.top }]}><ScrollView contentContainerStyle={[s.contenido, { paddingBottom: insets.bottom + 32 }]}>
    <View style={s.header}>
      <Pressable accessibilityLabel={t('habitos.recordatorios.volver')} onPress={() => router.back()} style={s.back}><ChevronLeft color={C.texto} size={26} /></Pressable>
      <View style={s.headerTexto}><View style={s.tituloFila}><Bell color={C.morado} size={24} /><Texto style={s.titulo}>{t('habitos.recordatorios.titulo')}</Texto></View><Texto style={s.subtitulo}>{t('habitos.recordatorios.subtitulo')}</Texto></View>
    </View>
    <ListaRecordatoriosHabitos
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
