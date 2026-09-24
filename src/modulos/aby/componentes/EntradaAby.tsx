import { useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';
import { PaperPlaneTilt } from 'phosphor-react-native';

import { RecuadroGlass } from '../../../diseno';
import { hapticSeguro } from '../../../nucleo/dispositivo/haptics';

export function EntradaAby({ colorEnviar = '#141414', deshabilitada, onEnviar, placeholder, variante = 'barra' }: { colorEnviar?: string; deshabilitada?: boolean; onEnviar: (texto: string) => void; placeholder?: string; variante?: 'barra' | 'centro' }) {
  const [valor, setValor] = useState('');
  const enviar = () => { const limpio = valor.trim(); if (!limpio || deshabilitada) return; hapticSeguro('accion'); onEnviar(limpio); setValor(''); };
  const contenido = <><TextInput editable={!deshabilitada} keyboardAppearance="light" onChangeText={setValor} onSubmitEditing={enviar} placeholder={placeholder ?? 'Cuéntale a Aby lo que necesitas...'} placeholderTextColor="#9B8FA1" returnKeyType="send" style={styles.input} value={valor} multiline /><Pressable accessibilityLabel="Enviar mensaje" accessibilityRole="button" disabled={deshabilitada} onPress={enviar} style={[styles.enviar, { backgroundColor: colorEnviar }]}><PaperPlaneTilt color="#FFFFFF" size={19} weight="fill" /></Pressable></>;
  if (variante === 'centro') return <RecuadroGlass blur intensity={36} style={[styles.raiz, styles.centro]}>{contenido}</RecuadroGlass>;
  return <View style={styles.raiz}>{contenido}</View>;
}

const styles = StyleSheet.create({ centro: { alignSelf: 'center', backgroundColor: 'rgba(255,255,255,0.38)', borderRadius: 19, minHeight: 50, padding: 4, width: '78%' }, enviar: { alignItems: 'center', borderRadius: 18, height: 42, justifyContent: 'center', width: 42 }, input: { color: '#44394B', flex: 1, fontFamily: 'MontserratAlternates-Medium', fontSize: 12, maxHeight: 82, minHeight: 42, paddingHorizontal: 12, paddingVertical: 9 }, raiz: { alignItems: 'flex-end', backgroundColor: 'rgba(255,255,255,0.93)', borderColor: 'rgba(91,46,145,0.15)', borderRadius: 20, borderWidth: 1, flexDirection: 'row', gap: 8, padding: 5, shadowColor: '#402164', shadowOffset: { height: 5, width: 0 }, shadowOpacity: 0.08, shadowRadius: 12 }, });
