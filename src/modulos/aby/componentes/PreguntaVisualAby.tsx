import { Pressable, StyleSheet, View } from 'react-native';

import { Texto } from '../../../diseno';
import { hapticSeguro } from '../../../nucleo/dispositivo/haptics';
import type { CategoriaAbyId, PreguntaVisualAby } from '../contrato/aby.contrato';
import { ArbolLateralTurnoAby } from './ArbolLateralTurnoAby';

const dias = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];

type Props = {
  acento?: string;
  categoria?: CategoriaAbyId | null;
  pregunta: PreguntaVisualAby;
  seleccionado: string | string[] | null;
  onSeleccionar: (valor: string | string[]) => void;
};

export function PreguntaVisualAby({ acento = '#141414', categoria = null, pregunta, seleccionado, onSeleccionar }: Props) {
  const colorActivo = { backgroundColor: acento, borderColor: acento };
  if (pregunta.tipo === 'dias') {
    const seleccionados = Array.isArray(seleccionado) ? seleccionado : [];
    return (
      <View style={styles.raiz}><ArbolLateralTurnoAby categoria={categoria} />
        <Texto style={styles.titulo}>{pregunta.titulo}</Texto>
        <View style={styles.dias}>
          {dias.map((dia, indice) => {
            const valor = String(indice + 1);
            const activo = seleccionados.includes(valor);
            return <Pressable accessibilityLabel={`Dia ${dia}`} accessibilityRole="button" accessibilityState={{ selected: activo }} key={dia} onPress={() => { hapticSeguro('seleccion'); onSeleccionar(activo ? seleccionados.filter((item) => item !== valor) : [...seleccionados, valor]); }} style={[styles.dia, activo && colorActivo]}><Texto style={[styles.diaTexto, activo && styles.diaTextoActivo]}>{dia}</Texto></Pressable>;
          })}
        </View>
      </View>
    );
  }

  return (
    <View style={styles.raiz}><ArbolLateralTurnoAby categoria={categoria} />
      <Texto style={styles.titulo}>{pregunta.titulo}</Texto>
      <View style={pregunta.tipo === 'cards' ? styles.cards : styles.chips}>
        {pregunta.opciones.slice(0, 4).map((opcion) => {
          const activo = seleccionado === opcion.valor;
          return <Pressable accessibilityLabel={opcion.etiqueta} accessibilityRole="button" accessibilityState={{ selected: activo }} key={opcion.valor} onPress={() => { hapticSeguro('seleccion'); onSeleccionar(opcion.valor); }} style={[pregunta.tipo === 'cards' ? styles.card : styles.chip, activo && colorActivo]}><Texto style={[pregunta.tipo === 'cards' ? styles.cardTexto : styles.chipTexto, activo && styles.activoTexto]}>{opcion.etiqueta}</Texto></Pressable>;
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  activo: { backgroundColor: '#5B2E91', borderColor: '#5B2E91' },
  activoTexto: { color: '#FFFFFF' },
  card: { backgroundColor: 'rgba(255,255,255,0.76)', borderColor: 'rgba(91,46,145,0.12)', borderRadius: 18, borderWidth: 1, flex: 1, minHeight: 72, padding: 14 },
  cardTexto: { color: '#4D3D57', fontFamily: 'MontserratAlternates-Bold', fontSize: 12, lineHeight: 16 },
  cards: { flexDirection: 'row', gap: 10 },
  chip: { backgroundColor: 'rgba(255,255,255,0.72)', borderColor: 'rgba(91,46,145,0.14)', borderRadius: 999, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 10 },
  chipTexto: { color: '#4D3D57', fontFamily: 'MontserratAlternates-Bold', fontSize: 12 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  dia: { alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.72)', borderColor: 'rgba(91,46,145,0.14)', borderRadius: 16, borderWidth: 1, height: 43, justifyContent: 'center', width: 36 },
  diaActivo: { backgroundColor: '#5B2E91', borderColor: '#5B2E91' },
  diaTexto: { color: '#4D3D57', fontFamily: 'MontserratAlternates-Bold', fontSize: 12 },
  diaTextoActivo: { color: '#FFFFFF' },
  dias: { flexDirection: 'row', gap: 6, justifyContent: 'space-between' },
  raiz: { gap: 11, overflow: 'hidden', paddingLeft: 35, paddingTop: 4 },
  titulo: { color: '#40354A', fontFamily: 'MontserratAlternates-Bold', fontSize: 14, lineHeight: 20 },
});
