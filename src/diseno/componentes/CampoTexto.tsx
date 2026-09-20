import { ComponentType, ReactNode } from 'react';
import { StyleProp, StyleSheet, Text, TextInput, TextInputProps, TextStyle, View, ViewStyle } from 'react-native';

import { bordes } from '../fundamentos/bordes';
import { colores } from '../fundamentos/colores';
import { espaciado } from '../fundamentos/espaciado';
import { useEscala } from '../tema/MasterColorContext';
import type { EscalaMaster } from '../tema/escalaEsmeralda';

type IconoCampo = ComponentType<{
  color?: string;
  size?: number;
  strokeWidth?: number;
}>;

type CampoTextoProps = TextInputProps & {
  campoStyle?: StyleProp<ViewStyle>;
  contenedorStyle?: StyleProp<ViewStyle>;
  error?: string;
  helper?: string;
  iconoDerecha?: IconoCampo;
  iconoIzquierda?: IconoCampo;
  iconoSize?: number;
  iconoStrokeWidth?: number;
  label?: string;
  rightSlot?: ReactNode;
  variante?: 'normal' | 'flotante';
};

export function CampoTexto({
  campoStyle,
  contenedorStyle,
  error,
  helper,
  iconoDerecha: IconoDerecha,
  iconoIzquierda: IconoIzquierda,
  iconoSize = 20,
  iconoStrokeWidth = 2.2,
  label,
  rightSlot,
  style,
  variante = 'normal',
  ...props
}: CampoTextoProps) {
  const styles = useEstilosStyles();
  const colorIcono = error ? colores.error : colores.tintaTenue;
  const inputStyle = style as TextStyle | TextStyle[] | undefined;

  return (
    <View style={[styles.raiz, contenedorStyle]}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <View style={[styles.campo, styles[`campo_${variante}`], error && styles.campoError, campoStyle]}>
        {IconoIzquierda ? <IconoIzquierda color={colorIcono} size={iconoSize} strokeWidth={iconoStrokeWidth} /> : null}
        <TextInput
          placeholderTextColor={colores.tintaTenue}
          {...props}
          style={[styles.input, inputStyle]}
        />
        {rightSlot ??
          (IconoDerecha ? <IconoDerecha color={colorIcono} size={iconoSize} strokeWidth={iconoStrokeWidth} /> : null)}
      </View>
      {error ? <Text style={[styles.helper, styles.helperError]}>{error}</Text> : null}
      {!error && helper ? <Text style={styles.helper}>{helper}</Text> : null}
    </View>
  );
}

const crearEstilosStyles = (esc: EscalaMaster) => StyleSheet.create({
  raiz: {
    gap: espaciado.sm,
  },
  label: {
    color: colores.texto,
    fontFamily: 'MontserratAlternates-SemiBold',
    fontSize: 13,
  },
  campo: {
    alignItems: 'center',
    backgroundColor: colores.superficie,
    borderColor: colores.borde,
    borderRadius: bordes.md,
    borderWidth: 1.5,
    flexDirection: 'row',
    gap: espaciado.sm,
    minHeight: 52,
    paddingHorizontal: espaciado.md,
  },
  campo_flotante: {
    borderColor: 'transparent',
    minHeight: 54,
    shadowColor: esc.musgo.l21,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.14,
    shadowRadius: 0,
  },
  campo_normal: {},
  campoError: {
    borderColor: colores.error,
  },
  input: {
    backgroundColor: 'transparent',
    color: colores.texto,
    flex: 1,
    fontFamily: 'MontserratAlternates-SemiBold',
    fontSize: 15,
    minHeight: 48,
    paddingHorizontal: 0,
  },
  helper: {
    color: colores.tintaTenue,
    fontFamily: 'MontserratAlternates-Medium',
    fontSize: 12,
    lineHeight: 17,
  },
  helperError: {
    color: colores.error,
  },
});

const estilosPorEscalaStyles = new WeakMap<EscalaMaster, ReturnType<typeof crearEstilosStyles>>();

function useEstilosStyles() {
  const esc = useEscala();
  let valor = estilosPorEscalaStyles.get(esc);
  if (!valor) {
    valor = crearEstilosStyles(esc);
    estilosPorEscalaStyles.set(esc, valor);
  }
  return valor;
}
