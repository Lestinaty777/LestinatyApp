import { PropsWithChildren } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { colores } from '../fundamentos/colores';
import { espaciado } from '../fundamentos/espaciado';

export function Divisor({ children }: PropsWithChildren) {
  return (
    <View style={styles.raiz}>
      <View style={styles.linea} />
      {children ? <Text style={styles.texto}>{children}</Text> : null}
      <View style={styles.linea} />
    </View>
  );
}

const styles = StyleSheet.create({
  raiz: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: espaciado.sm,
  },
  linea: {
    backgroundColor: colores.borde,
    flex: 1,
    height: 1,
  },
  texto: {
    color: colores.tintaTenue,
    fontFamily: 'MontserratAlternates-SemiBold',
    fontSize: 12,
  },
});
