import { ComponentType, PropsWithChildren, ReactNode } from 'react';
import { Pressable, StyleProp, StyleSheet, Text, TextStyle, ViewStyle } from 'react-native';

import { bordes } from '../fundamentos/bordes';
import { colores } from '../fundamentos/colores';
import { espaciado } from '../fundamentos/espaciado';
import { hapticSeguro } from '../../nucleo/dispositivo/haptics';

type IconoBoton = ComponentType<{
  color?: string;
  size?: number;
  strokeWidth?: number;
}>;

type VarianteBoton = 'primario' | 'secundario' | 'ghost' | 'peligro';

type BotonProps = PropsWithChildren<{
  disabled?: boolean;
  iconoDerecha?: IconoBoton;
  iconoIzquierda?: IconoBoton;
  iconoSize?: number;
  iconoStrokeWidth?: number;
  onPress?: () => void;
  rightSlot?: ReactNode;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  variante?: VarianteBoton;
}>;

export function Boton({
  children,
  disabled = false,
  iconoDerecha: IconoDerecha,
  iconoIzquierda: IconoIzquierda,
  iconoSize = 21,
  iconoStrokeWidth = 2.8,
  onPress,
  rightSlot,
  style,
  textStyle,
  variante = 'primario',
}: BotonProps) {
  const esPrimario = variante === 'primario' || variante === 'peligro';
  const colorIcono = esPrimario ? colores.superficie : variante === 'ghost' ? colores.acento : colores.texto;
  const desplazamientoPresionado = variante === 'primario' || variante === 'peligro' ? 6 : 3;
  const manejarPress = () => {
    hapticSeguro('accion');
    onPress?.();
  };

  return (
    <Pressable
      disabled={disabled}
      onPress={manejarPress}
      style={({ pressed }) => [
        styles.base,
        styles[variante],
        pressed && variante !== 'ghost' && { transform: [{ translateY: desplazamientoPresionado }] },
        pressed && variante === 'ghost' && styles.ghostPresionado,
        pressed && styles.sinLip,
        disabled && styles.deshabilitado,
        style,
      ]}
    >
      {IconoIzquierda ? <IconoIzquierda color={colorIcono} size={iconoSize} strokeWidth={iconoStrokeWidth} /> : null}
      <Text
        style={[
          styles.texto,
          IconoIzquierda || IconoDerecha || rightSlot ? styles.textoConIcono : null,
          styles[`texto_${variante}`],
          textStyle,
        ]}
      >
        {children}
      </Text>
      {rightSlot ?? (IconoDerecha ? <IconoDerecha color={colorIcono} size={iconoSize} strokeWidth={iconoStrokeWidth} /> : null)}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    alignItems: 'center',
    borderRadius: bordes.md,
    flexDirection: 'row',
    gap: espaciado.sm,
    justifyContent: 'center',
    minHeight: 52,
    paddingHorizontal: espaciado.lg,
  },
  primario: {
    backgroundColor: colores.primario,
    shadowColor: colores.primarioOscuro,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 1,
    shadowRadius: 0,
  },
  secundario: {
    backgroundColor: colores.superficie,
    borderColor: colores.borde,
    borderWidth: 1.5,
    shadowColor: colores.lipSecundario,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 1,
    shadowRadius: 0,
  },
  ghost: {
    backgroundColor: 'transparent',
    minHeight: 36,
    paddingHorizontal: espaciado.xs,
  },
  peligro: {
    backgroundColor: colores.error,
    shadowColor: colores.errorOscuro,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 1,
    shadowRadius: 0,
  },
  sinLip: {
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
  },
  ghostPresionado: {
    opacity: 0.72,
    transform: [{ translateY: 1 }],
  },
  deshabilitado: {
    backgroundColor: colores.tintaTenue,
    opacity: 0.45,
    shadowColor: colores.lipSecundario,
    transform: [{ translateY: 0 }],
  },
  texto: {
    fontFamily: 'MontserratAlternates-Bold',
    fontSize: 15,
    textAlign: 'center',
  },
  textoConIcono: {
    flex: 1,
  },
  texto_primario: {
    color: colores.superficie,
  },
  texto_secundario: {
    color: colores.texto,
  },
  texto_ghost: {
    color: colores.acento,
  },
  texto_peligro: {
    color: colores.superficie,
  },
});
