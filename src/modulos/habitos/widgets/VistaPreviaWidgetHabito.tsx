import { Flame, Plus, Check } from 'lucide-react-native';
import { Image, type ImageSourcePropType, Pressable, StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MasterIcon, Texto } from '../../../diseno';

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
 * Réplica fiel en JS del widget nativo real (widget_habito_foco.xml +
 * HabitoFocoWidgetProvider.kt) — mismos colores, misma estructura (pedestal +
 * racha, ilustración de etapa con botón flotante, nombre, calendario
 * semanal). Es un componente aparte, no HabitoFocoWidget.tsx (ese sigue
 * siendo el widget JS legado de react-native-android-widget) — así el
 * mockup se puede mantener sincronizado con el diseño nativo actual sin
 * arriesgar el sistema de widgets viejo.
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
      <View style={s.filaSuperior}>
        <View style={s.pedestal}>
          <MasterIcon color={2} name="hoja" size={18} />
        </View>
        <View style={s.espacio} />
        <View style={s.rachaChip}>
          <Flame color="#F97316" fill="#F97316" size={12} />
          <Texto style={s.rachaTexto}>{racha} d</Texto>
        </View>
      </View>

      <View style={s.imagenContenedor}>
        <Image resizeMode="contain" source={imagenEtapa} style={s.imagen} />
        <Pressable
          accessibilityLabel={completado ? 'Completado' : 'Registrar avance'}
          onPress={onIncrementar}
          style={[s.botonAccion, completado && s.botonAccionCompletado]}
        >
          {completado ? <Check color="#FFFFFF" size={16} strokeWidth={3} /> : <Plus color="#FFFFFF" size={16} strokeWidth={3} />}
        </Pressable>
      </View>

      <Texto numberOfLines={1} style={s.titulo}>{titulo}</Texto>

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
  raiz: { borderRadius: 24, flex: 1, padding: 12 },
  filaSuperior: { alignItems: 'center', flexDirection: 'row' },
  pedestal: {
    alignItems: 'center', backgroundColor: '#CCFFFFFF', borderColor: '#A0CDE8D0', borderRadius: 10,
    borderWidth: 1, height: 30, justifyContent: 'center', width: 30,
  },
  espacio: { flex: 1 },
  rachaChip: {
    alignItems: 'center', backgroundColor: '#E6FFF8EE', borderColor: '#CCFDE2BF', borderRadius: 999,
    borderWidth: 1, flexDirection: 'row', gap: 3, paddingHorizontal: 7, paddingVertical: 3,
  },
  rachaTexto: { color: '#B86200', fontFamily: 'Montserrat-Bold', fontSize: 9 },
  imagenContenedor: { flex: 1, marginTop: 4, position: 'relative' },
  imagen: { height: '100%', width: '100%' },
  botonAccion: {
    alignItems: 'center', backgroundColor: '#21A844', borderRadius: 15, bottom: 0, height: 30,
    justifyContent: 'center', position: 'absolute', right: 0, width: 30,
  },
  botonAccionCompletado: { backgroundColor: '#14702D' },
  titulo: { color: '#111E13', fontFamily: 'Montserrat-Bold', fontSize: 12, marginTop: 4 },
  semanaFila: { flexDirection: 'row', gap: 3, marginTop: 6 },
  diaCelda: { alignItems: 'center', borderRadius: 999, flex: 1, height: 18, justifyContent: 'center' },
  diaNoProgramado: { backgroundColor: '#E9EFEA' },
  diaCompletado: { backgroundColor: '#21A844' },
  diaPerdido: { backgroundColor: '#F0D3D1' },
  diaPendiente: { backgroundColor: 'transparent', borderColor: '#8FB89A', borderWidth: 1 },
  diaTexto: { fontFamily: 'Montserrat-Bold', fontSize: 8 },
});
