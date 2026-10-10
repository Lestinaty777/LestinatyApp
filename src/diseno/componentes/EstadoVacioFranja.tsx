import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, View } from 'react-native';

import type { FranjaConcreta } from '../../compartido/utilidades/franjas';
import { MasterButton } from './MasterButton';
import { ICONOS_FRANJA } from './SelectorFranja';
import { Texto } from './Texto';

// Colores de cada momento del día: amanecer cálido, tarde anaranjada, noche
// índigo. Son fijos a propósito (no siguen el tema): representan la hora, no
// la marca. Sin verdes, que en esta app pertenecen al tema.
const AMBIENTE: Record<FranjaConcreta, { cielo: readonly [string, string]; halo: string; icono: string; texto: string }> = {
  manana: { cielo: ['#FEF3C7', '#FDBA74'], halo: 'rgba(251, 191, 36, 0.18)', icono: '#B45309', texto: '#92400E' },
  tarde: { cielo: ['#FED7AA', '#FDA4AF'], halo: 'rgba(249, 115, 22, 0.16)', icono: '#C2410C', texto: '#9A3412' },
  noche: { cielo: ['#C7D2FE', '#A5B4FC'], halo: 'rgba(99, 102, 241, 0.18)', icono: '#3730A3', texto: '#3730A3' },
};

// Lo que se ve al elegir una franja que no tiene nada: en vez de una línea de
// texto, el momento del día dibujado (su ícono sobre un cielo de su color), a
// qué horas corresponde y una salida. Sin textos propios: llegan por props.
export function EstadoVacioFranja({ accion, franja, horario, onAccion, texto, titulo }: {
  /** Texto del botón; sin él no se muestra botón. */
  accion?: string;
  franja: FranjaConcreta;
  /** Rango de horas ya formateado, con AM/PM, p. ej. "5:00 AM – 12:00 PM". */
  horario: string;
  onAccion?: () => void;
  texto: string;
  titulo: string;
}) {
  const ambiente = AMBIENTE[franja];
  const Icono = ICONOS_FRANJA[franja];
  return (
    <View style={estilos.raiz}>
      <View style={[estilos.halo, { backgroundColor: ambiente.halo }]}>
        <LinearGradient colors={ambiente.cielo} end={{ x: 1, y: 1 }} start={{ x: 0, y: 0 }} style={estilos.cielo}>
          <Icono color={ambiente.icono} size={38} strokeWidth={2.2} />
        </LinearGradient>
      </View>
      <View style={[estilos.horario, { backgroundColor: ambiente.halo }]}>
        <Texto style={[estilos.horarioTexto, { color: ambiente.texto }]}>{horario}</Texto>
      </View>
      <Texto accessibilityRole="header" style={estilos.titulo}>{titulo}</Texto>
      <Texto style={estilos.texto}>{texto}</Texto>
      {accion && onAccion ? <View style={estilos.boton}><MasterButton color={ambiente.icono} iconoIzquierda={ICONOS_FRANJA.todo} onPress={onAccion}>{accion}</MasterButton></View> : null}
    </View>
  );
}

const estilos = StyleSheet.create({
  raiz: { alignItems: 'center', gap: 6, paddingBottom: 8, paddingTop: 6 },
  halo: { alignItems: 'center', borderRadius: 56, height: 112, justifyContent: 'center', width: 112 },
  cielo: { alignItems: 'center', borderRadius: 42, height: 84, justifyContent: 'center', width: 84 },
  horario: { borderRadius: 10, marginTop: 6, paddingHorizontal: 10, paddingVertical: 3 },
  horarioTexto: { fontFamily: 'Montserrat-Bold', fontSize: 11, letterSpacing: 0.3 },
  titulo: { color: '#1A1335', fontFamily: 'MontserratAlternates-Bold', fontSize: 18, marginTop: 2, textAlign: 'center' },
  texto: { color: '#7B7494', fontFamily: 'Montserrat-Medium', fontSize: 13, lineHeight: 18, paddingHorizontal: 12, textAlign: 'center' },
  boton: { marginTop: 10 },
});
