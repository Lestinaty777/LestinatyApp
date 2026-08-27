import { PropsWithChildren } from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';

import { bordes } from '../fundamentos/bordes';
import { espaciado } from '../fundamentos/espaciado';
import { sombras } from '../fundamentos/sombras';
import { obtenerColoresUI } from '../tema/ui';

type TarjetaProps = PropsWithChildren<{
  style?: ViewStyle;
}>;

export function Tarjeta({ children, style }: TarjetaProps) {
  const colores = obtenerColoresUI();

  return <View style={[styles.base, { backgroundColor: colores.superficie, borderColor: colores.borde }, style]}>{children}</View>;
}

const styles = StyleSheet.create({
  base: {
    borderRadius: bordes.lg,
    borderWidth: 1,
    gap: espaciado.md,
    padding: espaciado.lg,
    ...sombras.tarjeta,
  },
});
