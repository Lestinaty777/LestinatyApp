import { ComponentType, PropsWithChildren, ReactNode } from 'react';
import { Pressable, StyleProp, StyleSheet, Text, TextStyle, View, ViewStyle } from 'react-native';

import { hapticSeguro } from '../../nucleo/dispositivo/haptics';

type IconoMasterButton = ComponentType<{
  color?: string;
  size?: number;
  strokeWidth?: number;
}>;

export type MasterButtonProps = PropsWithChildren<{
  /** Cara superior saturada; normalmente el color real del nodo o hábito. */
  color: string;
  /** Extrusión inferior. Si se omite, se obtiene al oscurecer `color`. */
  colorSombra?: string;
  /** Bisel interior superior. */
  colorBisel?: string;
  /** Blanco por defecto para asegurar contraste sobre la cara saturada. */
  colorTexto?: string;
  disabled?: boolean;
  iconoDerecha?: IconoMasterButton;
  iconoIzquierda?: IconoMasterButton;
  iconoSize?: number;
  iconoStrokeWidth?: number;
  onPress?: () => void;
  rightSlot?: ReactNode;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
}>;

function oscurecer(color: string, factor = 0.52) {
  const valores = color.replace('#', '').match(/.{2}/g);
  if (!valores) return color;
  return `#${valores.map((valor) => Math.round(parseInt(valor, 16) * factor).toString(16).padStart(2, '0')).join('')}`;
}

/**
 * Botón de acción saturado con la misma presión física del botón Sendero.
 * A diferencia de `Boton`, su paleta completa es configurable por llamada.
 */
export function MasterButton({
  children,
  color,
  colorBisel = 'rgba(255,255,255,0.42)',
  colorSombra,
  colorTexto = '#FFFFFF',
  disabled = false,
  iconoDerecha: IconoDerecha,
  iconoIzquierda: IconoIzquierda,
  iconoSize = 18,
  iconoStrokeWidth = 2.7,
  onPress,
  rightSlot,
  style,
  textStyle,
}: MasterButtonProps) {
  const cara = disabled ? 'rgba(0,0,0,0.15)' : color;
  const extrusion = colorSombra ?? oscurecer(color);
  const colorContenido = disabled ? 'rgba(255,255,255,0.4)' : colorTexto;

  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={() => { hapticSeguro('accion'); onPress?.(); }}
      style={[styles.contenedor, style]}
    >
      {({ pressed }) => (
        <View style={styles.anchoCompleto}>
          {!disabled ? <View pointerEvents="none" style={[styles.cara, styles.extrusion, { backgroundColor: extrusion }]} /> : null}
          <View style={[styles.cara, { backgroundColor: cara, transform: [{ translateY: pressed || disabled ? 4 : 0 }] }]}>
            <View pointerEvents="none" style={[styles.bisel, { borderColor: disabled ? 'rgba(255,255,255,0.1)' : colorBisel }]} />
            {IconoIzquierda ? <IconoIzquierda color={colorContenido} size={iconoSize} strokeWidth={iconoStrokeWidth} /> : null}
            <Text style={[styles.texto, textStyle, { color: colorContenido }]}>{children}</Text>
            {rightSlot ?? (IconoDerecha ? <IconoDerecha color={colorContenido} size={iconoSize} strokeWidth={iconoStrokeWidth} /> : null)}
          </View>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  contenedor: {
    alignItems: 'center',
    height: 44,
    width: '100%',
  },
  anchoCompleto: {
    alignItems: 'center',
    height: 44,
    width: '100%',
  },
  cara: {
    alignItems: 'center',
    borderRadius: 14,
    flexDirection: 'row',
    gap: 6,
    height: 40,
    justifyContent: 'center',
    position: 'absolute',
    top: 0,
    width: '100%',
  },
  extrusion: {
    top: 4,
  },
  bisel: {
    borderRadius: 12,
    borderTopWidth: 1.5,
    bottom: 4,
    left: 4,
    position: 'absolute',
    right: 4,
    top: 2,
  },
  texto: {
    fontFamily: 'MontserratAlternates-Bold',
    fontSize: 13,
  },
});
