import { StyleSheet } from 'react-native';

export const preparacionEstilos = StyleSheet.create({
  raiz: { backgroundColor: '#F3EEFA', bottom: 0, left: 0, overflow: 'hidden', position: 'absolute', right: 0, top: 0, zIndex: 20 },
  contenido: { alignItems: 'center', paddingHorizontal: 34, paddingTop: 130, zIndex: 2 },
  orbeGlow: { borderRadius: 90, height: 180, position: 'absolute', top: -18, width: 180 },
  titulo: { fontFamily: 'MontserratAlternates-Bold', fontSize: 26, marginTop: 22, textAlign: 'center' },
  sub: { color: '#7B7494', fontSize: 14, lineHeight: 21, marginTop: 7, textAlign: 'center' },
  // Escena central: un solo brote creciendo, no una fila repetida de árboles.
  escena: { alignItems: 'center', bottom: 0, height: 320, justifyContent: 'flex-end', left: 0, position: 'absolute', right: 0, zIndex: 0 },
  base: { height: 70, resizeMode: 'contain', width: 210, zIndex: 1 },
  arbolSecundario: { bottom: 62, height: 168, left: '58%', position: 'absolute', resizeMode: 'contain', width: 145, zIndex: 2 },
  arbolPrincipal: { bottom: 55, height: 235, position: 'absolute', resizeMode: 'contain', width: 195, zIndex: 3 },
  flor: { bottom: 205, height: 62, position: 'absolute', resizeMode: 'contain', width: 62, zIndex: 4 },
});
