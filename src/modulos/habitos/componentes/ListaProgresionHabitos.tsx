import { ChevronRight } from 'lucide-react-native';
import { Pressable, StyleSheet, View } from 'react-native';

import { fuenteInsignia, MasterChanger, RecuadroGlass, Texto } from '../../../diseno';
import { tonoVerdeNivel } from '../iconosHabitos';
import type { PlanHabitoResumen } from '../tipos';

const NIVEL_MAXIMO = 7;
const C = { texto: '#1A1335', tenue: '#7B7494', glass: 'rgba(255,255,255,0.72)', glassBorde: 'rgba(255,255,255,0.85)' };

// Lista pura (sin header ni pantalla propia) para que la use tanto
// ProgresionHabitosPantalla (ruta standalone, útil para deep-link) como
// HabitosPantalla (incrustada, actualiza el panel de abajo sin navegar).
export function ListaProgresionHabitos({ isError, isLoading, onReintentar, onSeleccionar, planes }: {
  isError: boolean;
  isLoading: boolean;
  onReintentar: () => void;
  onSeleccionar: (id: string) => void;
  planes: PlanHabitoResumen[];
}) {
  if (isLoading) return <Texto style={s.estado}>Cargando tu progresión…</Texto>;
  if (isError) return <Pressable onPress={onReintentar}><Texto style={s.error}>No pudimos cargar tu progresión. Toca para reintentar.</Texto></Pressable>;
  if (planes.length === 0) return <Texto style={s.estado}>Crea tu primer hábito para empezar a subir de nivel.</Texto>;

  return <>{planes.map((plan) => {
    const tono = tonoVerdeNivel(plan.nivel);
    return (
      <Pressable key={plan.id} onPress={() => onSeleccionar(plan.id)} style={s.fila}>
        <RecuadroGlass style={s.filaGlass}>
          <View style={[s.icono, { backgroundColor: `${tono}18` }]}><MasterChanger ancho={34} alto={34} colorDestino={2} fuente={fuenteInsignia(plan.nivel)} /></View>
          <View style={s.filaCentro}>
            <View style={s.filaTop}>
              <Texto numberOfLines={1} style={s.filaTitulo}>{plan.titulo}</Texto>
              <View style={[s.nivelPill, { backgroundColor: `${tono}18` }]}><Texto style={[s.nivelPillTexto, { color: tono }]}>Nivel {plan.nivel}</Texto></View>
            </View>
            <View style={s.puntosFila}>
              {Array.from({ length: NIVEL_MAXIMO }).map((_, indice) => (
                <View key={indice} style={[s.punto, indice < plan.nivel && { backgroundColor: tono }]} />
              ))}
            </View>
          </View>
          <ChevronRight color={C.tenue} size={18} />
        </RecuadroGlass>
      </Pressable>
    );
  })}</>;
}

const s = StyleSheet.create({
  estado: { color: C.tenue, paddingVertical: 18, textAlign: 'center' },
  error: { color: '#DC2626', paddingVertical: 18, textAlign: 'center' },
  fila: {},
  filaGlass: { alignItems: 'center', backgroundColor: C.glass, borderColor: C.glassBorde, borderRadius: 18, borderWidth: 1, flexDirection: 'row', gap: 11, padding: 12 },
  icono: { alignItems: 'center', borderRadius: 13, height: 44, justifyContent: 'center', width: 44 },
  iconoImagen: { height: 29, resizeMode: 'contain', width: 29 },
  filaCentro: { flex: 1, gap: 7 },
  filaTop: { alignItems: 'center', flexDirection: 'row', gap: 8, justifyContent: 'space-between' },
  filaTitulo: { color: C.texto, flex: 1, fontFamily: 'Montserrat-Bold', fontSize: 15 },
  nivelPill: { borderRadius: 99, paddingHorizontal: 10, paddingVertical: 5 },
  nivelPillTexto: { fontFamily: 'Montserrat-Bold', fontSize: 12 },
  puntosFila: { flexDirection: 'row', gap: 5 },
  punto: { backgroundColor: '#E7E1F1', borderRadius: 4, flex: 1, height: 7 },
});
