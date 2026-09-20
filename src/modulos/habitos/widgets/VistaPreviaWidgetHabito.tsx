import { Flame, Plus, Check } from 'lucide-react-native';
import { Image, type ImageSourcePropType, Pressable, StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Texto } from '../../../diseno';

const LETRAS_DIA = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];

export type VistaPreviaWidgetHabitoProps = {
  titulo: string;
  racha: number;
  completado: boolean;
  imagenEtapa: ImageSourcePropType;
  /** Días de esta semana (lunes=1..domingo=7) en los que el hábito está programado. */
  diasProgramados: number[];
  /** Subconjunto de diasProgramados ya cumplidos. */
  diasCompletadosSemana: number[];
  onIncrementar?: () => void;
};

/**
 * Réplica fiel en JS del widget nativo real ("diorama hero": la ilustración
 * de etapa ocupa casi todo el widget, racha y botón de acción flotan sobre
 * sus esquinas superiores, el nombre se escribe sobre un degradado al pie de
 * la imagen) — mismos colores y estructura que widget_habito_foco.xml +
 * HabitoFocoWidgetProvider.kt. Componente aparte de HabitoFocoWidget.tsx (el
 * widget JS legado de react-native-android-widget), para no arriesgar ese
 * sistema al mantener este mockup sincronizado con el diseño nativo actual.
 */
export function VistaPreviaWidgetHabito({
  titulo,
  racha,
  completado,
  imagenEtapa,
  diasProgramados,
  diasCompletadosSemana,
  onIncrementar,
}: VistaPreviaWidgetHabitoProps) {
  const hoyIndice = (new Date().getDay() + 6) % 7; // 0=lunes..6=domingo

  return (
    <LinearGradient colors={['#FAFDF9', '#F1FBF1', '#E2F4E3']} style={s.raiz}>
      <View style={s.imagenContenedor}>
        <Image resizeMode="contain" source={imagenEtapa} style={s.imagen} />

        {/* Degradado inferior para que el nombre sea legible sobre la imagen */}
        <LinearGradient colors={['transparent', 'rgba(11,31,15,0.8)']} style={s.scrim} />

        <View style={s.rachaChip}>
          <Flame color="#F97316" fill="#F97316" size={11} />
          <Texto style={s.rachaTexto}>{racha} d</Texto>
        </View>

        <Pressable
          accessibilityLabel={completado ? 'Completado' : 'Registrar avance'}
          onPress={onIncrementar}
          style={[s.botonAccion, completado && s.botonAccionCompletado]}
        >
          {completado ? <Check color="#FFFFFF" size={15} strokeWidth={3} /> : <Plus color="#FFFFFF" size={15} strokeWidth={3} />}
        </Pressable>

        <Texto numberOfLines={1} style={s.titulo}>{titulo}</Texto>
      </View>

      <View style={s.semanaFila}>
        {LETRAS_DIA.map((letra, indice) => {
          const idDia = indice + 1;
          const estaProgramado = diasProgramados.includes(idDia);
          const estaCompletado = diasCompletadosSemana.includes(idDia);
          const esPasado = indice < hoyIndice;

          let estilo = s.diaNoProgramado;
          let colorTexto = '#9AA69B';
          if (estaCompletado) {
            estilo = s.diaCompletado;
            colorTexto = '#FFFFFF';
          } else if (!estaProgramado) {
            estilo = s.diaNoProgramado;
            colorTexto = '#9AA69B';
          } else if (esPasado) {
            estilo = s.diaPerdido;
            colorTexto = '#9C4A44';
          } else {
            estilo = s.diaPendiente;
            colorTexto = '#33402F';
          }

          return (
            <View key={letra + indice} style={[s.diaCelda, estilo]}>
              <Texto style={[s.diaTexto, { color: colorTexto }]}>{letra}</Texto>
            </View>
          );
        })}
      </View>
    </LinearGradient>
  );
}

const s = StyleSheet.create({
  raiz: { borderRadius: 24, flex: 1, padding: 10 },
  imagenContenedor: { flex: 1, position: 'relative' },
  imagen: { height: '100%', width: '100%' },
  scrim: { bottom: 0, height: 36, left: 0, position: 'absolute', right: 0 },
  rachaChip: {
    // Cream/naranja tenue, no verde — mismo tono que la app usa para racha
    // (fuego), en formato RN #RRGGBBAA (el XML de Android equivalente usa
    // #AARRGGBB, con el alfa primero: no son intercambiables tal cual).
    alignItems: 'center', backgroundColor: '#FFF8EEE6', borderColor: '#FDE2BFCC', borderRadius: 999,
    borderWidth: 1, flexDirection: 'row', gap: 3, left: 4, paddingHorizontal: 6, paddingVertical: 3, position: 'absolute', top: 4,
  },
  rachaTexto: { color: '#B86200', fontFamily: 'Montserrat-Bold', fontSize: 9 },
  botonAccion: {
    alignItems: 'center', backgroundColor: '#21A844', borderRadius: 13, height: 26,
    justifyContent: 'center', position: 'absolute', right: 4, top: 4, width: 26,
  },
  botonAccionCompletado: { backgroundColor: '#14702D' },
  titulo: {
    bottom: 4, color: '#FFFFFF', fontFamily: 'Montserrat-Bold', fontSize: 12, left: 6, position: 'absolute', right: 6,
  },
  semanaFila: { flexDirection: 'row', gap: 3, marginTop: 6 },
  diaCelda: { alignItems: 'center', borderRadius: 999, flex: 1, height: 18, justifyContent: 'center' },
  diaNoProgramado: { backgroundColor: '#E9EFEA' },
  diaCompletado: { backgroundColor: '#21A844' },
  diaPerdido: { backgroundColor: '#F0D3D1' },
  diaPendiente: { backgroundColor: 'transparent', borderColor: '#8FB89A', borderWidth: 1 },
  diaTexto: { fontFamily: 'Montserrat-Bold', fontSize: 8 },
});
