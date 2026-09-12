import { StyleSheet } from 'react-native';

export const preparacionEstilos = StyleSheet.create({
  raiz: { backgroundColor: '#F3EEFA', bottom: 0, left: 0, position: 'absolute', right: 0, top: 0, zIndex: 20 },
  contenido: { alignItems: 'center', paddingHorizontal: 34, paddingTop: 150, zIndex: 2 },
  orbe: { alignItems: 'center', borderRadius: 72, height: 144, justifyContent: 'center', width: 144 },
  icono: { height: 108, resizeMode: 'contain', width: 108 },
  titulo: { fontFamily: 'Montserrat-Bold', fontSize: 27, marginTop: 22, textAlign: 'center' },
  sub: { color: '#7B7494', fontSize: 14, lineHeight: 21, marginTop: 7, textAlign: 'center' },
  barra: { marginTop: 24, width: '100%' },
  porcentaje: { color: '#1A1335', fontFamily: 'Montserrat-Bold', fontSize: 14, marginTop: 10 },
  particula: { borderRadius: 99, height: 7, position: 'absolute', width: 7, zIndex: 1 },
  paisaje: { bottom: 0, height: 280, left: 0, position: 'absolute', right: 0, zIndex: 0 },
  arbol: { bottom: 0, height: 190, left: -20, position: 'absolute', resizeMode: 'contain', width: 180 },
  arbolMedio: { bottom: 16, height: 155, left: '26%', width: 150 },
  arbolDer: { bottom: 0, height: 180, left: undefined, right: -18, width: 170 },
  arbusto: { bottom: 3, height: 105, left: '15%', position: 'absolute', resizeMode: 'contain', width: 108 },
  arbustoMedio: { bottom: 30, left: '48%' },
  arbustoDer: { bottom: 8, left: undefined, right: '10%' },
});
