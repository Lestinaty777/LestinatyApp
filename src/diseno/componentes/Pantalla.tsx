import { PropsWithChildren } from 'react';
import { ScrollView, StyleSheet, ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { espaciado } from '../fundamentos/espaciado';
import { obtenerColoresUI } from '../tema/ui';

type PantallaProps = PropsWithChildren<{
  style?: ViewStyle;
}>;

export function Pantalla({ children, style }: PantallaProps) {
  const colores = obtenerColoresUI();

  return (
    <SafeAreaView style={[styles.raiz, { backgroundColor: colores.fondo }]} edges={['left', 'right', 'bottom']}>
      <ScrollView contentContainerStyle={[styles.contenido, style]}>{children}</ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  raiz: {
    flex: 1,
  },
  contenido: {
    flexGrow: 1,
    gap: espaciado.lg,
    padding: espaciado.lg,
  },
});
