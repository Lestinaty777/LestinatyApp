import { ComponentType, PropsWithChildren, ReactNode } from 'react';
import { Pressable, StyleProp, StyleSheet, Text, TextStyle, View, ViewStyle } from 'react-native';

import { bordes } from '../fundamentos/bordes';
import { colores } from '../fundamentos/colores';
import { useColores } from '../tema/useColores';
import { espaciado } from '../fundamentos/espaciado';
import { hapticSeguro } from '../../nucleo/dispositivo/haptics';

type IconoBoton = ComponentType<{
  color?: string;
  size?: number;
  strokeWidth?: number;
}>;

type VarianteBoton = 'primario' | 'secundario' | 'ghost' | 'peligro' | 'sendero';

type BotonProps = PropsWithChildren<{
  color?: string;
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
  color: colorProp,
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
  const marca = useColores();
  const color = colorProp ?? marca.primario;
  if (variante === 'sendero') {
    return <BotonSendero color={color} disabled={disabled} iconoIzquierda={IconoIzquierda} iconoSize={iconoSize} iconoStrokeWidth={iconoStrokeWidth} onPress={onPress} style={style}>{children}</BotonSendero>;
  }
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
        variante === 'primario' && { backgroundColor: marca.primario, shadowColor: marca.primarioOscuro },
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

function BotonSendero({ children, color, disabled, iconoIzquierda: IconoIzquierda, iconoSize, iconoStrokeWidth, onPress, style }: Pick<BotonProps, 'children' | 'disabled' | 'iconoIzquierda' | 'iconoSize' | 'iconoStrokeWidth' | 'onPress' | 'style'> & { color: string }) {
  const manejarPress = () => { hapticSeguro('accion'); onPress?.(); };
  const colorBase = disabled ? 'rgba(0,0,0,0.15)' : color;
  return (
    <Pressable disabled={disabled} onPress={manejarPress} style={[styles.senderoContenedor, style]}>
      {({ pressed }) => (
        <View style={styles.senderoAncho}>
          <View style={[styles.senderoCara, styles.senderoExtrusion, { backgroundColor: oscurecer(color, 0.5), display: disabled ? 'none' : 'flex' }]} />
          <View style={[styles.senderoCara, { backgroundColor: colorBase, transform: [{ translateY: pressed || disabled ? 4 : 0 }] }]}>
            <View style={[styles.senderoBisel, disabled && { borderColor: 'rgba(255,255,255,0.1)' }]} />
            {IconoIzquierda ? <IconoIzquierda color={disabled ? 'rgba(255,255,255,0.4)' : '#FFFFFF'} size={iconoSize} strokeWidth={iconoStrokeWidth} /> : null}
            <Text style={[styles.textoSendero, { color: disabled ? 'rgba(255,255,255,0.4)' : '#FFFFFF' }]}>{children}</Text>
          </View>
        </View>
      )}
    </Pressable>
  );
}

function oscurecer(color: string, factor: number) {
  const valores = color.replace('#', '').match(/.{2}/g);
  if (!valores) return color;
  return `#${valores.map((valor) => Math.round(parseInt(valor, 16) * factor).toString(16).padStart(2, '0')).join('')}`;
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
  // backgroundColor y shadowColor de la variante primaria salen de useColores() (siguen el tono).
  primario: {
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
  senderoContenedor: {
    alignItems: 'center',
    height: 44,
    width: '100%',
  },
  senderoAncho: {
    alignItems: 'center',
    height: 44,
    width: '100%',
  },
  senderoCara: {
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
  senderoExtrusion: {
    top: 4,
  },
  senderoBisel: {
    borderColor: 'rgba(255,255,255,0.4)',
    borderRadius: 12,
    borderTopWidth: 1.5,
    bottom: 4,
    left: 4,
    pointerEvents: 'none',
    position: 'absolute',
    right: 4,
    top: 2,
  },
  textoSendero: {
    fontFamily: 'MontserratAlternates-Bold',
    fontSize: 13,
  },
});
