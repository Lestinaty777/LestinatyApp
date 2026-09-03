import { StyleSheet, View } from 'react-native';
import { Texto, colores } from '../../../../diseno';
import { obtenerWidgetAccion } from './registroAcciones';
import type { EstadoWidgetAccion, EventoWidgetAccion, WidgetAccionPack } from './tipos';
import { CapaCompletado } from './widgets/CapaCompletado';

type Props = { color: string; estado: EstadoWidgetAccion; onEvento: (evento: EventoWidgetAccion) => void; widget: WidgetAccionPack; };

export function RenderizadorAccion({ color, estado, onEvento, widget }: Props) {
  const definicion = obtenerWidgetAccion(widget.id);
  if (!definicion) return <View style={styles.fallback}><Texto style={styles.fallbackTexto}>Widget pendiente: {widget.id}</Texto></View>;

  const Componente = definicion.Componente;
  return (
    <View style={{ position: 'relative' }}>
      <Componente color={color} config={widget.config} estado={estado} onEvento={onEvento} />
      <CapaCompletado color={color} activo={estado === 'completado'} />
    </View>
  );
}
const styles = StyleSheet.create({
  fallback: { alignItems: 'center', backgroundColor: 'rgba(100, 86, 68, 0.08)', borderRadius: 16, borderStyle: 'dashed', borderWidth: 1, justifyContent: 'center', minHeight: 88, padding: 14 },
  fallbackTexto: { color: colores.textoSecundario, fontFamily: 'MontserratAlternates-Bold', fontSize: 10 },
});
