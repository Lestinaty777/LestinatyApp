import { PropsWithChildren } from 'react';
import { StyleSheet, Text as TextoRN, TextProps as TextoRNProps } from 'react-native';

import { TOPE_ESCALA_TEXTO } from '../fundamentos/accesibilidad';
import { tipografia } from '../fundamentos/tipografia';
import { obtenerColoresUI } from '../tema/ui';

type VarianteTexto = 'titulo' | 'subtitulo' | 'cuerpo' | 'ayuda';

type TextoProps = PropsWithChildren<
  TextoRNProps & {
    variante?: VarianteTexto;
  }
>;

// maxFontSizeMultiplier tiene un tope por defecto (ver accesibilidad.ts) para
// que el texto más grande de iOS/Android no rompa los contenedores de alto
// fijo de la app — se puede pasar uno distinto (o `undefined` para quitarlo)
// donde el layout tenga espacio de sobra.
export function Texto({ children, maxFontSizeMultiplier = TOPE_ESCALA_TEXTO, variante = 'cuerpo', style, ...props }: TextoProps) {
  // Red de seguridad contra recortes: un texto de una sola línea que no cabe se
  // encoge (hasta 80 %) en vez de terminar en "…"; si cabe, no cambia nada.
  const unaLinea = props.numberOfLines === 1;
  const colores = obtenerColoresUI();

  return (
    <TextoRN adjustsFontSizeToFit={unaLinea} minimumFontScale={unaLinea ? 0.8 : undefined} {...props} maxFontSizeMultiplier={maxFontSizeMultiplier} style={[styles.base, styles[variante], { color: variante === 'ayuda' ? colores.textoSecundario : colores.texto }, style]}>
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
