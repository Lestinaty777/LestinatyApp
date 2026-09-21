import { ChevronLeft, ChevronRight } from 'lucide-react-native';
import { Image, type ImageSourcePropType, Pressable, StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Texto } from '../../../diseno';

export type VistaPreviaWidgetHabitoProps = {
  titulo: string;
  actual: number;
  meta: number;
  completado: boolean;
  imagenEtapa: ImageSourcePropType;
  iconoFuente?: ImageSourcePropType;
  /** Los 3 colores (claro/medio/oscuro) del degradado, ya rotados al tono del
   * paquete — mismos que recibe el widget nativo, para que el fondo se vea igual. */
  fondoClaro?: string;
  fondoMedio?: string;
  fondoOscuro?: string;
  /** Color de acento del paquete, para teñir el ícono (tintColor plano, igual que el setColorFilter nativo). */
  iconoColor?: string;
  /** Tocar la barra registra avance, igual que el botón "+" de antes. */
  onIncrementar?: () => void;
  onAnterior?: () => void;
  onSiguiente?: () => void;
  /** Con un solo hábito no hay entre qué navegar — se ocultan los chevrones. */
  mostrarChevrones?: boolean;
};

const FONDO_POR_DEFECTO: [string, string, string] = ['#FAFDF9', '#F1FBF1', '#E2F4E3'];

/**
 * Réplica fiel en JS del widget nativo real (4x2, horizontal):
 * chevron ‹ | ícono + nombre + barra (toque = registrar avance) | ilustración
 * de la etapa | chevron › — mismos ids/estructura que widget_habito_foco.xml +
 * HabitoFocoWidgetProvider.kt. Componente aparte de HabitoFocoWidget.tsx (el
 * widget JS legado de react-native-android-widget).
 */
export function VistaPreviaWidgetHabito({
  titulo,
  actual,
  meta,
  completado,
  imagenEtapa,
  iconoFuente,
  fondoClaro,
  fondoMedio,
  fondoOscuro,
  iconoColor,
  onIncrementar,
  onAnterior,
  onSiguiente,
  mostrarChevrones = false,
}: VistaPreviaWidgetHabitoProps) {
  const porcentaje = Math.min(100, Math.round((actual * 100) / Math.max(1, meta)));
  const coloresFondo: [string, string, string] = fondoClaro && fondoMedio && fondoOscuro
    ? [fondoClaro, fondoMedio, fondoOscuro]
    : FONDO_POR_DEFECTO;

  return (
    <LinearGradient colors={coloresFondo} end={{ x: 1, y: 1 }} start={{ x: 0, y: 0 }} style={s.raiz}>
      {mostrarChevrones ? (
        <Pressable accessibilityLabel="Hábito anterior" onPress={onAnterior} style={s.chevron}>
          <ChevronLeft color="#33402F" size={16} />
        </Pressable>
      ) : (
        <View style={s.chevron} />
      )}

      <View style={s.contenidoVariable}>
        <View style={s.columnaTexto}>
          <View style={s.filaIconoTitulo}>
            {iconoFuente && (
              <Image resizeMode="contain" source={iconoFuente} style={[s.icono, iconoColor ? { tintColor: iconoColor } : null]} />
            )}
            <Texto numberOfLines={1} style={s.titulo}>{titulo}</Texto>
          </View>

          <Pressable accessibilityLabel="Registrar avance" onPress={onIncrementar} style={s.barraFondo}>
            <View style={[s.barraRelleno, { width: `${porcentaje}%` }, completado && s.barraCompleta]} />
          </Pressable>
        </View>

        <Image resizeMode="contain" source={imagenEtapa} style={s.imagen} />
      </View>

      {mostrarChevrones ? (
        <Pressable accessibilityLabel="Siguiente hábito" onPress={onSiguiente} style={s.chevron}>
          <ChevronRight color="#33402F" size={16} />
        </Pressable>
      ) : (
        <View style={s.chevron} />
      )}
    </LinearGradient>
  );
}

const s = StyleSheet.create({
  raiz: {
    alignItems: 'center', borderRadius: 20, flex: 1,
    flexDirection: 'row', padding: 6,
  },
  chevron: { alignItems: 'center', height: '100%', justifyContent: 'center', width: 22 },
  contenidoVariable: { alignItems: 'center', flex: 1, flexDirection: 'row', marginHorizontal: 4 },
  columnaTexto: { flex: 1.1, justifyContent: 'center' },
  filaIconoTitulo: { alignItems: 'center', flexDirection: 'row' },
  icono: { height: 14, marginEnd: 5, width: 14 },
  titulo: { color: '#111E13', flexShrink: 1, fontFamily: 'Montserrat-Bold', fontSize: 12 },
  barraFondo: { backgroundColor: '#CDE8D0', borderRadius: 6, height: 10, marginTop: 6, overflow: 'hidden', width: '100%' },
  barraRelleno: { backgroundColor: '#21A844', borderRadius: 6, height: '100%' },
  barraCompleta: { backgroundColor: '#14702D' },
  imagen: { flex: 0.85, height: '100%', marginStart: 8 },
});
