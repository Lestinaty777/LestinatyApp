import { Pressable, StyleSheet, View } from 'react-native';

import { FRANJAS_ORDEN, type FranjaDia } from '../../compartido/utilidades/franjas';
import { hapticSeguro } from '../../nucleo/dispositivo/haptics';
import { Texto } from './Texto';

// Cuatro botones para elegir en qué franja del día vive un hábito o tarea
// (Mañana · Tarde · Noche · Sin franja). Controlado, accesible y sin textos
// propios (llegan por props en `etiquetas`).
export function SelectorFranjaElemento({ color, etiquetas, onCambiar, valor }: {
  color: string;
  etiquetas: Record<FranjaDia, string>;
  onCambiar: (franja: FranjaDia) => void;
  valor: FranjaDia;
}) {
  return (
    <View accessibilityRole="radiogroup" style={estilos.fila}>
      {FRANJAS_ORDEN.map((franja) => {
        const activo = franja === valor;
        return (
          <Pressable
            accessibilityLabel={etiquetas[franja]}
            accessibilityRole="radio"
            accessibilityState={{ selected: activo }}
            hitSlop={6}
            key={franja}
            onPress={() => {
              if (!activo) {
                hapticSeguro('seleccion');
                onCambiar(franja);
              }
            }}
            style={[estilos.boton, activo ? { backgroundColor: color, borderColor: color } : estilos.botonInactivo]}
          >
            <Texto style={[estilos.etiqueta, activo && estilos.etiquetaActiva]}>{etiquetas[franja]}</Texto>
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
});
