import { PropsWithChildren } from 'react';
import { StyleSheet, Text as TextoRN, TextProps as TextoRNProps } from 'react-native';

import { tipografia } from '../fundamentos/tipografia';
import { obtenerColoresUI } from '../tema/ui';

type VarianteTexto = 'titulo' | 'subtitulo' | 'cuerpo' | 'ayuda';

type TextoProps = PropsWithChildren<
  TextoRNProps & {
    variante?: VarianteTexto;
  }
>;

export function Texto({ children, variante = 'cuerpo', style, ...props }: TextoProps) {
  const colores = obtenerColoresUI();

  return (
    <TextoRN {...props} style={[styles.base, styles[variante], { color: variante === 'ayuda' ? colores.textoSecundario : colores.texto }, style]}>
      {children}
    </TextoRN>
  );
}

const styles = StyleSheet.create({
  base: {
    fontFamily: 'MontserratAlternates-Medium',
  },
  titulo: {
    fontSize: tipografia.titulo,
    fontFamily: 'Montserrat-Bold',
    lineHeight: 38,
  },
  subtitulo: {
    fontSize: tipografia.subtitulo,
    fontFamily: 'MontserratAlternates-Bold',
    lineHeight: 28,
  },
  cuerpo: {
    fontSize: tipografia.cuerpo,
    lineHeight: 23,
  },
  ayuda: {
    fontFamily: 'MontserratAlternates-Medium',
    fontSize: tipografia.ayuda,
    lineHeight: 20,
  },
});
