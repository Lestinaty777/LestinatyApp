import { StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { MasterProgressbar, Texto } from '../../../diseno';
import type { ProgresoSeccionPanel } from '../../habitos/tipos';
import { ESCALA_ESMERALDA } from '../../../diseno/tema/escalaEsmeralda';

const C = { tenue: ESCALA_ESMERALDA.musgo.l51 };

// Se muestra en vez de un esqueleto infinito cuando una sección del panel
// (patrones/riesgo/conexiones) todavía no llegó a 'listo' — con el número
// real de cuánto llevás acumulado, no un mensaje genérico de "cargando".
export function SeccionProgresoDatos({ mensaje, progreso }: { mensaje: string; progreso?: ProgresoSeccionPanel }) {
  const { t } = useTranslation();
  const actual = progreso?.actual ?? 0;
  const requerido = progreso?.requerido ?? 7;
  const porcentaje = requerido > 0 ? Math.min(100, Math.round((100 * actual) / requerido)) : 0;

  return (
    <View style={s.contenedor}>
      <Texto style={s.mensaje}>{mensaje}</Texto>
      <MasterProgressbar altura={7} porcentaje={porcentaje} />
      <Texto style={s.contador}>{t('insights.progress.counter', { actual: Math.min(actual, requerido), requerido })}</Texto>
    </View>
  );
}

const s = StyleSheet.create({
  contenedor: { gap: 8, marginTop: 12, paddingVertical: 4 },
  mensaje: { color: C.tenue, fontFamily: 'Montserrat-Medium', fontSize: 10, lineHeight: 14 },
  contador: { color: C.tenue, fontFamily: 'Montserrat-Bold', fontSize: 9, textAlign: 'right' },
});
