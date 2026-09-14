import { Children, isValidElement, PropsWithChildren } from 'react';
import { StyleProp, ViewStyle } from 'react-native';
import Animated, { Easing, FadeInDown, FadeOut } from 'react-native-reanimated';

const DURACION_DEFECTO = 420;
const DURACION_SALIDA_DEFECTO = 260;

type OpcionesEntradaEncadenada = { duracion?: number; retraso?: number };

// Fórmula única de "entrada en cadena": el retraso de la pieza N es N veces
// la duración de cada pieza — así la pieza N no empieza a moverse hasta que
// la N-1 terminó POR COMPLETO. A diferencia del cascade clásico (delay corto
// + duración larga), aquí nunca hay dos piezas animándose a medio camino al
// mismo tiempo. Exportada suelta para layouts que MasterAnimation no puede
// aplanar (una fila con piezas de anchos distintos, por ejemplo) pero que
// igual deben seguir la misma cadencia — se usa directamente como `entering`.
export function entradaEncadenada(indice: number, { duracion = DURACION_DEFECTO, retraso = 0 }: OpcionesEntradaEncadenada = {}) {
  return FadeInDown.delay(retraso + indice * duracion).duration(duracion).easing(Easing.out(Easing.cubic));
}

type MasterAnimationProps = PropsWithChildren<{
  /** Cuánto tarda en entrar cada pieza — también es el hueco antes de que arranque la siguiente. */
  duracion?: number;
  duracionSalida?: number;
  estiloItem?: StyleProp<ViewStyle>;
  /** Espera inicial antes de que arranque la primera pieza. */
  retraso?: number;
}>;

// Envoltorio para listas planas de hermanos (una tarjeta por hábito, una fila
// por recordatorio…): cada hijo directo entra en cadena según su posición, en
// el orden en que aparece como children — no hace falta calcular índices ni
// delays a mano. La salida (cuando un hijo se desmonta, p. ej. un banner que
// se descarta) es un fundido simple, no encadenado.
export function MasterAnimation({ children, duracion, duracionSalida = DURACION_SALIDA_DEFECTO, estiloItem, retraso }: MasterAnimationProps) {
  const piezas = Children.toArray(children).filter(isValidElement);
  return (
    <>
      {piezas.map((pieza, indice) => (
        <Animated.View
          entering={entradaEncadenada(indice, { duracion, retraso })}
          exiting={FadeOut.duration(duracionSalida)}
          key={pieza.key ?? indice}
          style={estiloItem}
        >
          {pieza}
        </Animated.View>
      ))}
    </>
  );
}
