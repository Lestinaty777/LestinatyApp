import { Pressable, StyleSheet, View } from 'react-native';

import { FILTROS_FRANJA, type FiltroFranja } from '../../compartido/utilidades/franjas';
import { hapticSeguro } from '../../nucleo/dispositivo/haptics';
import { Texto } from './Texto';

// Cuatro botones pequeños (Mañana · Tarde · Noche · Todo) con el número de
// pendientes de cada uno. Controlado: quien lo usa decide qué filtro está
// activo y cuándo reiniciarlo. Sin texto propio (i18n) a propósito, para que
// viva en el sistema de diseño sin depender de ningún módulo.
// Spec: docs/superpowers/specs/2026-10-04-franjas-del-dia-design.md
export function SelectorFranja({ color, conteos, etiquetaAccesible, etiquetas, onCambiar, valor }: {
  /** Color del botón activo (el acento del módulo). */
  color: string;
  conteos: Record<FiltroFranja, number>;
  /** Lectura para lector de pantalla, p. ej. "Mañana, 3 pendientes" — el número no debe depender solo del color. */
  etiquetaAccesible: (filtro: FiltroFranja, pendientes: number) => string;
  etiquetas: Record<FiltroFranja, string>;
  onCambiar: (filtro: FiltroFranja) => void;
  valor: FiltroFranja;
}) {
  return (
    <View accessibilityRole="tablist" style={estilos.fila}>
      {FILTROS_FRANJA.map((filtro) => {
        const activo = filtro === valor;
        return (
          <Pressable
            accessibilityLabel={etiquetaAccesible(filtro, conteos[filtro])}
            accessibilityRole="tab"
            accessibilityState={{ selected: activo }}
            hitSlop={6}
            key={filtro}
            onPress={() => { if (!activo) { hapticSeguro('seleccion'); onCambiar(filtro); } }}
            style={[estilos.boton, activo ? { backgroundColor: color, borderColor: color } : estilos.botonInactivo]}
          >
            <Texto style={[estilos.etiqueta, activo && estilos.etiquetaActiva]}>{etiquetas[filtro]}</Texto>
            <View style={[estilos.contador, activo ? estilos.contadorActivo : estilos.contadorInactivo]}>
              <Texto style={[estilos.contadorTexto, activo && { color }]}>{conteos[filtro]}</Texto>
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}

const estilos = StyleSheet.create({
  fila: { flexDirection: 'row', gap: 6 },
  boton: { alignItems: 'center', borderRadius: 16, borderWidth: 1.5, flexDirection: 'row', gap: 5, justifyContent: 'center', minHeight: 32, paddingHorizontal: 10, paddingVertical: 4 },
  botonInactivo: { backgroundColor: 'rgba(255,255,255,0.72)', borderColor: 'rgba(255,255,255,0.85)' },
  etiqueta: { color: '#4B4660', fontFamily: 'Montserrat-Bold', fontSize: 12 },
  etiquetaActiva: { color: '#FFFFFF' },
  contador: { alignItems: 'center', borderRadius: 9, justifyContent: 'center', minWidth: 18, paddingHorizontal: 5, paddingVertical: 1 },
  contadorInactivo: { backgroundColor: 'rgba(26,19,53,0.08)' },
  contadorActivo: { backgroundColor: '#FFFFFF' },
  contadorTexto: { color: '#4B4660', fontFamily: 'Montserrat-Bold', fontSize: 11 },
});
