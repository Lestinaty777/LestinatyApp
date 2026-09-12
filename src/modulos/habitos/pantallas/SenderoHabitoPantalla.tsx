import { useQuery } from '@tanstack/react-query';
import { router } from 'expo-router';
import { ArrowLeft, Trophy } from 'lucide-react-native';
import { Pressable, StyleSheet, View, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Texto } from '../../../diseno';
import { ContenedorMapaSenderos } from '../../senderos/componentes/mapa/ContenedorMapaSenderos';
import type { NodoMapaSendero } from '../../senderos/datos/mapaEjercicio.mock';
import { obtenerDetalleHabito } from '../habitos.servicio';
import { NIVEL_MAXIMO_TONO } from '../iconosHabitos';

// El sendero de un hábito no son lecciones falsas: cada nodo ES uno de sus 7
// niveles reales (habitos_planes.nivel), completado/activo/bloqueado según el
// nivel real que ya calcula registrar_progreso_habito() en el backend.
function construirNodosNiveles(nivelActual: number): NodoMapaSendero[] {
  return Array.from({ length: NIVEL_MAXIMO_TONO }, (_, indice) => {
    const nivel = indice + 1;
    return {
      estado: nivel < nivelActual ? 'completado' : nivel === nivelActual ? 'activo' : 'bloqueado',
      icono: Trophy,
      id: `nivel-${nivel}`,
      subtitulo: nivel === NIVEL_MAXIMO_TONO ? 'Nivel máximo' : `Nivel ${nivel}`,
      titulo: `Nivel ${nivel}`,
    };
  });
}

export function SenderoHabitoPantalla({ id }: { id: string }) {
  const { height } = useWindowDimensions();
  const consulta = useQuery({ queryKey: ['habitos', 'detalle', id], queryFn: () => obtenerDetalleHabito(id) });

  return (
    <SafeAreaView edges={['top']} style={s.raiz}>
      <View style={s.cab}>
        <Pressable accessibilityLabel="Volver" hitSlop={12} onPress={() => router.back()} style={s.volver}>
          <ArrowLeft color="#1A1335" size={20} />
        </Pressable>
        <View style={{ flex: 1 }}>
          <Texto style={s.titulo}>{consulta.data?.habito.titulo ?? 'Tu sendero'}</Texto>
          {consulta.data && <Texto style={s.sub}>Nivel {consulta.data.nivel} de {NIVEL_MAXIMO_TONO}</Texto>}
        </View>
      </View>
      {consulta.isLoading && <View style={s.centro}><Texto style={s.sub}>Cargando tu sendero…</Texto></View>}
      {(consulta.isError || (!consulta.isLoading && !consulta.data)) && <View style={s.centro}><Texto style={s.sub}>No pudimos abrir este sendero.</Texto></View>}
      {consulta.data && (
        <ContenedorMapaSenderos
          altura={height * 0.82}
          categoriaId="habitos"
          color={consulta.data.habito.color}
          enfocado
          nodos={construirNodosNiveles(consulta.data.nivel)}
          subcategoriaId={id}
          tono={consulta.data.nivel}
        />
      )}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  cab: { alignItems: 'center', flexDirection: 'row', gap: 12, paddingBottom: 8, paddingHorizontal: 20, paddingTop: 6 },
  centro: { alignItems: 'center', flex: 1, justifyContent: 'center', padding: 24 },
  raiz: { backgroundColor: '#EAEAEA', flex: 1 },
  sub: { color: '#7B7494', fontSize: 12 },
  titulo: { color: '#1A1335', fontFamily: 'Montserrat-Bold', fontSize: 20 },
  volver: { alignItems: 'center', backgroundColor: 'rgba(255,255,255,.7)', borderRadius: 16, height: 38, justifyContent: 'center', width: 38 },
});
