import { StyleSheet, View } from 'react-native';

import { Texto } from '../../../diseno';
import type { MensajeAby as MensajeAbyTipo } from '../contrato/aby.contrato';

export function MensajeAby({ mensaje }: { mensaje: MensajeAbyTipo }) {
  const esAby = mensaje.autor === 'aby';
  return (
    <View accessibilityRole="text" style={[styles.burbuja, esAby ? styles.aby : styles.usuario]}>
      <Texto style={[styles.texto, !esAby && styles.textoUsuario]}>{mensaje.texto}</Texto>
    </View>
  );
}

const styles = StyleSheet.create({
  aby: { alignSelf: 'flex-start', backgroundColor: 'rgba(255,255,255,0.82)', borderColor: 'rgba(91,46,145,0.12)' },
  burbuja: { borderRadius: 20, borderWidth: 1, maxWidth: '86%', paddingHorizontal: 15, paddingVertical: 11 },
  texto: { color: '#453A4B', fontFamily: 'MontserratAlternates-Medium', fontSize: 13, lineHeight: 19 },
  textoUsuario: { color: '#FFFFFF' },
  usuario: { alignSelf: 'flex-end', backgroundColor: '#5B2E91', borderColor: 'rgba(255,255,255,0.3)' },
});

