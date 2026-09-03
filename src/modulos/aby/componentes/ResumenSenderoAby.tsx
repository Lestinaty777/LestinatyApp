import { Pressable, StyleSheet, View } from 'react-native';
import { PencilSimple } from 'phosphor-react-native';

import { RecuadroGlass, Texto } from '../../../diseno';
import { hapticSeguro } from '../../../nucleo/dispositivo/haptics';
import type { ConfiguracionConversacionAby, PreguntaIdAby } from '../contrato/aby.contrato';

const nombreDias = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];

export function ResumenSenderoAby({ configuracion, onEditar }: { configuracion: ConfiguracionConversacionAby; onEditar: (id: PreguntaIdAby) => void }) {
  const frecuencia = configuracion.tipo === 'finito' ? 'Objetivo con final' : configuracion.diasSemana.map((dia) => nombreDias[dia - 1]).join(' - ');
  const filas: { etiqueta: string; texto: string; id: PreguntaIdAby }[] = [
    { etiqueta: 'Ritmo', texto: configuracion.tipo === 'ciclico' ? 'Rutina recurrente' : 'Objetivo con final', id: 'tipo' },
    { etiqueta: 'Dias', texto: frecuencia || 'Sin dias', id: 'frecuencia' },
    { etiqueta: 'Tiempo', texto: `${configuracion.duracionMinutos ?? 0} min`, id: 'duracion' },
  ];
  return <RecuadroGlass blur intensity={20} style={styles.raiz}><Texto style={styles.sobrelinea}>TU PUNTO DE PARTIDA</Texto><Texto style={styles.objetivo}>{configuracion.objetivo}</Texto>{filas.map((fila) => <View key={fila.id} style={styles.fila}><View><Texto style={styles.etiqueta}>{fila.etiqueta}</Texto><Texto style={styles.valor}>{fila.texto}</Texto></View><Pressable accessibilityLabel={`Editar ${fila.etiqueta}`} accessibilityRole="button" onPress={() => { hapticSeguro('seleccion'); onEditar(fila.id); }} style={styles.editar}><PencilSimple color="#5B2E91" size={15} weight="bold" /></Pressable></View>)}</RecuadroGlass>;
}

const styles = StyleSheet.create({
  editar: { alignItems: 'center', backgroundColor: 'rgba(91,46,145,0.09)', borderRadius: 14, height: 30, justifyContent: 'center', width: 30 },
  etiqueta: { color: '#877C8A', fontFamily: 'MontserratAlternates-Bold', fontSize: 10, textTransform: 'uppercase' },
  fila: { alignItems: 'center', borderTopColor: 'rgba(91,46,145,0.08)', borderTopWidth: 1, flexDirection: 'row', justifyContent: 'space-between', paddingTop: 9 },
  objetivo: { color: '#3F3248', fontFamily: 'MontserratAlternates-Bold', fontSize: 16, lineHeight: 22 },
  raiz: { backgroundColor: 'rgba(255,255,255,0.68)', borderColor: 'rgba(91,46,145,0.14)', borderRadius: 24, borderWidth: 1, gap: 10, padding: 16 },
  sobrelinea: { color: '#76539C', fontFamily: 'MontserratAlternates-Bold', fontSize: 10, letterSpacing: 1 },
  valor: { color: '#4D3D57', fontFamily: 'MontserratAlternates-Medium', fontSize: 12, marginTop: 1 },
});

