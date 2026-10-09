import { LayoutList, Moon, Sun, Sunrise, type LucideIcon } from 'lucide-react-native';
import { Pressable, StyleSheet, View } from 'react-native';

import { FILTROS_FRANJA, type FiltroFranja } from '../../compartido/utilidades/franjas';
import { hapticSeguro } from '../../nucleo/dispositivo/haptics';
import { Texto } from './Texto';

/** Un ícono por franja: amanecer, sol, luna y lista (todo). */
export const ICONOS_FRANJA: Record<FiltroFranja, LucideIcon> = { manana: Sunrise, tarde: Sun, noche: Moon, todo: LayoutList };

// Cuatro botones (Mañana · Tarde · Noche · Todo), cada uno con su ícono y el
// número de pendientes. Controlado: quien lo usa decide qué filtro está activo
// y cuándo reiniciarlo. Sin texto propio (i18n) a propósito, para que viva en
// el sistema de diseño sin depender de ningún módulo: el nombre de cada franja
// llega en `etiquetaAccesible` (lector de pantalla) y, si se pide, en `etiquetas`.
// Spec: docs/superpowers/specs/2026-10-04-franjas-del-dia-design.md
export function SelectorFranja({ color, conteos, etiquetaAccesible, etiquetas, mostrarTexto = false, onCambiar, valor }: {
  /** Color del botón activo (el acento del módulo). */
  color: string;
  conteos: Record<FiltroFranja, number>;
  /** Lectura para lector de pantalla, p. ej. "Mañana, 3 pendientes" — ni el ícono ni el color son el único indicador. */
  etiquetaAccesible: (filtro: FiltroFranja, pendientes: number) => string;
  etiquetas: Record<FiltroFranja, string>;
  /** Muestra también el nombre junto al ícono. Por defecto solo ícono y número, para que quepan los cuatro. */
  mostrarTexto?: boolean;
  onCambiar: (filtro: FiltroFranja) => void;
  valor: FiltroFranja;
}) {
  return (
    <View accessibilityRole="tablist" style={estilos.fila}>
      {FILTROS_FRANJA.map((filtro) => {
        const activo = filtro === valor;
        const Icono = ICONOS_FRANJA[filtro];
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
            <Icono color={activo ? '#FFFFFF' : '#4B4660'} size={17} strokeWidth={2.4} />
            {mostrarTexto ? <Texto style={[estilos.etiqueta, activo && estilos.etiquetaActiva]}>{etiquetas[filtro]}</Texto> : null}
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
  boton: { alignItems: 'center', borderRadius: 16, borderWidth: 1.5, flex: 1, flexDirection: 'row', gap: 6, justifyContent: 'center', minHeight: 36, paddingHorizontal: 8, paddingVertical: 5 },
  botonInactivo: { backgroundColor: 'rgba(255,255,255,0.72)', borderColor: 'rgba(255,255,255,0.85)' },
  etiqueta: { color: '#4B4660', fontFamily: 'Montserrat-Bold', fontSize: 12 },
  etiquetaActiva: { color: '#FFFFFF' },
  contador: { alignItems: 'center', borderRadius: 9, justifyContent: 'center', minWidth: 18, paddingHorizontal: 5, paddingVertical: 1 },
  contadorInactivo: { backgroundColor: 'rgba(26,19,53,0.08)' },
  contadorActivo: { backgroundColor: '#FFFFFF' },
  contadorTexto: { color: '#4B4660', fontFamily: 'Montserrat-Bold', fontSize: 11 },
});
