import { StyleSheet, View } from 'react-native';
import { MasterProgressbar, Texto } from '../../../diseno';
import type { ProgresoSeccionPanel } from '../../habitos/tipos';

const C = { tenue: '#648170' };

// Se muestra en vez de un esqueleto infinito cuando una sección del panel
// (patrones/riesgo/conexiones) todavía no llegó a 'listo' — con el número
// real de cuánto llevás acumulado, no un mensaje genérico de "cargando".
export function SeccionProgresoDatos({ mensaje, progreso }: { mensaje: string; progreso?: ProgresoSeccionPanel }) {
  const actual = progreso?.actual ?? 0;
  const requerido = progreso?.requerido ?? 7;
  const porcentaje = requerido > 0 ? Math.min(100, Math.round((100 * actual) / requerido)) : 0;

  return (
    <View style={s.contenedor}>
      <Texto style={s.mensaje}>{mensaje}</Texto>
      <MasterProgressbar altura={7} porcentaje={porcentaje} />
      <Texto style={s.contador}>{Math.min(actual, requerido)} de {requerido} días</Texto>
    </View>
  );
}

const s = StyleSheet.create({
  contenedor: { gap: 8, marginTop: 12, paddingVertical: 4 },
  mensaje: { color: C.tenue, fontFamily: 'Montserrat-Medium', fontSize: 10, lineHeight: 14 },
  contador: { color: C.tenue, fontFamily: 'Montserrat-Bold', fontSize: 9, textAlign: 'right' },
});
