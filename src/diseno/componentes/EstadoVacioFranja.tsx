import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, View } from 'react-native';

import type { FranjaConcreta } from '../../compartido/utilidades/franjas';
import { conAlfa } from '../tema/masterColor';
import { MasterButton } from './MasterButton';
import { ICONOS_FRANJA } from './SelectorFranja';
import { Texto } from './Texto';

/** Mezcla un color #RRGGBB con blanco: 0 = el color, 1 = blanco. */
function aclarar(hex: string, proporcion: number): string {
  const canal = (indice: number) => {
    const valor = parseInt(hex.slice(indice, indice + 2), 16);
    return Math.round(valor + (255 - valor) * proporcion).toString(16).padStart(2, '0');
  };
  return `#${canal(1)}${canal(3)}${canal(5)}`;
}

// Lo que se ve al elegir una franja que no tiene nada: en vez de una línea de
// texto, el momento del día dibujado (su ícono sobre un cielo), a qué horas
// corresponde y una salida. El cielo, el ícono, el horario y el botón salen
// todos de `color`, que quien lo usa deriva del tema activo (un tono vecino
// distinto por franja): así combina con la pantalla en vez de traer colores
// fijos. Sin textos propios: llegan por props.
export function EstadoVacioFranja({ accion, color, franja, horario, onAccion, texto, titulo }: {
  /** Texto del botón; sin él no se muestra botón. */
  accion?: string;
  /** Color de esta franja (#RRGGBB), ya derivado del tema. */
  color: string;
  franja: FranjaConcreta;
  /** Rango de horas ya formateado, con AM/PM, p. ej. "5:00 AM – 12:00 PM". */
  horario: string;
  onAccion?: () => void;
  texto: string;
  titulo: string;
}) {
  const Icono = ICONOS_FRANJA[franja];
  return (
    <View style={estilos.raiz}>
      <View style={[estilos.halo, { backgroundColor: conAlfa(color, 0.14) }]}>
        <LinearGradient colors={[aclarar(color, 0.82), aclarar(color, 0.55)]} end={{ x: 1, y: 1 }} start={{ x: 0, y: 0 }} style={estilos.cielo}>
          <Icono color={color} size={38} strokeWidth={2.2} />
        </LinearGradient>
      </View>
      <View style={[estilos.horario, { backgroundColor: conAlfa(color, 0.14) }]}>
        <Texto style={[estilos.horarioTexto, { color }]}>{horario}</Texto>
      </View>
      <Texto accessibilityRole="header" style={estilos.titulo}>{titulo}</Texto>
      <Texto style={estilos.texto}>{texto}</Texto>
      {accion && onAccion ? <View style={estilos.boton}><MasterButton color={color} iconoIzquierda={ICONOS_FRANJA.todo} onPress={onAccion}>{accion}</MasterButton></View> : null}
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
