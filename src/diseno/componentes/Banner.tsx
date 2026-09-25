import { CircleAlert } from 'lucide-react-native';
import { PropsWithChildren } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { TOPE_ESCALA_TEXTO } from '../fundamentos/accesibilidad';
import { bordes } from '../fundamentos/bordes';
import { colores } from '../fundamentos/colores';
import { espaciado } from '../fundamentos/espaciado';

type BannerProps = PropsWithChildren<{
  variante?: 'error' | 'exito';
}>;

export function Banner({ children, variante = 'error' }: BannerProps) {
  const esError = variante === 'error';

  return (
    <View style={[styles.raiz, esError ? styles.error : styles.exito]}>
      <CircleAlert color={esError ? colores.error : colores.exito} size={17} strokeWidth={2.3} />
      <Text maxFontSizeMultiplier={TOPE_ESCALA_TEXTO} style={[styles.texto, esError ? styles.textoError : styles.textoExito]}>{children}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  raiz: {
    alignItems: 'flex-start',
    borderRadius: bordes.md,
    flexDirection: 'row',
    gap: espaciado.sm,
    paddingHorizontal: espaciado.md,
    paddingVertical: 12,
  },
  error: {
    backgroundColor: colores.errorSuave,
  },
  exito: {
    backgroundColor: colores.exitoSuave,
  },
  texto: {
    flex: 1,
    fontFamily: 'MontserratAlternates-SemiBold',
    fontSize: 13,
    lineHeight: 19,
  },
  textoError: {
    color: colores.error,
  },
  textoExito: {
    color: colores.exito,
  },
});
