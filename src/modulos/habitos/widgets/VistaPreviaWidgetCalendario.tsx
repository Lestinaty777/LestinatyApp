import { StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Texto } from '../../../diseno';

const LETRAS_DIA = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];
const NOMBRES_MES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];

export type VistaPreviaWidgetCalendarioProps = {
  anio: number;
  /** 1-12 */
  mes: number;
  /** Días del mes (1..31) con al menos un hábito completado. */
  diasCompletados: number[];
};

/**
 * Réplica fiel en JS del widget de calendario mensual nativo
 * (widget_calendario_mes.xml + CalendarioWidgetProvider.kt) — grilla fija
 * de 6x7, mismo criterio de "hoy" y de día completado.
 */
export function VistaPreviaWidgetCalendario({ anio, mes, diasCompletados }: VistaPreviaWidgetCalendarioProps) {
  const hoy = new Date();
  const esMesActual = anio === hoy.getFullYear() && mes === hoy.getMonth() + 1;
  const diaHoy = hoy.getDate();

  const primerDia = new Date(anio, mes - 1, 1);
  const offsetPrimerDia = (primerDia.getDay() + 6) % 7; // lunes=0..domingo=6
  const totalDias = new Date(anio, mes, 0).getDate();

  const celdas = Array.from({ length: 42 }, (_, indice) => indice - offsetPrimerDia + 1);

  return (
    <LinearGradient colors={['#FAFDF9', '#F1FBF1', '#E2F4E3']} style={s.raiz}>
      <Texto style={s.titulo}>{NOMBRES_MES[mes - 1]} {anio}</Texto>

      <View style={s.filaEncabezado}>
        {LETRAS_DIA.map((letra) => (
          <Texto key={letra} style={s.letraEncabezado}>{letra}</Texto>
        ))}
      </View>

      <View style={s.grilla}>
        {celdas.map((numeroDia, indice) => {
          if (numeroDia < 1 || numeroDia > totalDias) {
            return <View key={indice} style={s.celda} />;
          }
          const completado = diasCompletados.includes(numeroDia);
          const esHoy = esMesActual && numeroDia === diaHoy;

          return (
            <View key={indice} style={s.celda}>
              <View style={[s.circulo, completado && s.circuloCompletado, esHoy && !completado && s.circuloHoy]}>
                <Texto style={[s.numeroTexto, completado && s.numeroTextoCompletado]}>{numeroDia}</Texto>
              </View>
            </View>
          );
        })}
      </View>
    </LinearGradient>
  );
}

const s = StyleSheet.create({
  raiz: { borderRadius: 24, flex: 1, padding: 12 },
  titulo: { color: '#111E13', fontFamily: 'Montserrat-Bold', fontSize: 12, marginBottom: 6 },
  filaEncabezado: { flexDirection: 'row', marginBottom: 2 },
  letraEncabezado: { color: '#B7C2B8', flex: 1, fontFamily: 'Montserrat-Bold', fontSize: 8, textAlign: 'center' },
  grilla: { flex: 1, flexDirection: 'row', flexWrap: 'wrap' },
  celda: { alignItems: 'center', height: '16.66%', justifyContent: 'center', width: '14.28%' },
  circulo: { alignItems: 'center', aspectRatio: 1, borderRadius: 999, justifyContent: 'center', width: '78%' },
  circuloCompletado: { backgroundColor: '#21A844' },
  circuloHoy: { borderColor: '#21A844', borderWidth: 1 },
  numeroTexto: { color: '#111E13', fontFamily: 'Montserrat-Medium', fontSize: 8 },
  numeroTextoCompletado: { color: '#FFFFFF', fontFamily: 'Montserrat-Bold' },
});
