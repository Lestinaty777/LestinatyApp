import { useState } from 'react';
import { Modal, Pressable, StyleSheet, TextInput, View } from 'react-native';

import { Texto } from '../../../diseno';
import { validarNuevoHabito } from '../creacion';

export function CrearHabitoModal({ visible, guardando, onCerrar, onCrear }: { visible: boolean; guardando: boolean; onCerrar: () => void; onCrear: (input: { titulo: string; meta: number; unidad: string }) => void }) {
  const [titulo, setTitulo] = useState('');
  const [meta, setMeta] = useState('1');
  const [unidad, setUnidad] = useState('veces');
  const [error, setError] = useState<string | null>(null);
  function guardar() { const validacion = validarNuevoHabito({ titulo, meta, unidad }); if (validacion) { setError(validacion); return; } setError(null); onCrear({ titulo, meta: Number(meta), unidad }); }
  return <Modal animationType="slide" transparent visible={visible} onRequestClose={onCerrar}><View style={s.fondo}><View style={s.modal}><Texto style={s.titulo}>Nuevo hábito</Texto><Texto style={s.sub}>Define una meta diaria para comenzar.</Texto><TextInput accessibilityLabel="Nombre del hábito" onChangeText={setTitulo} placeholder="Ej. Beber agua" placeholderTextColor="#8A839D" style={s.input} value={titulo} /><TextInput accessibilityLabel="Meta" keyboardType="decimal-pad" onChangeText={setMeta} placeholder="Meta" placeholderTextColor="#8A839D" style={s.input} value={meta} /><TextInput accessibilityLabel="Unidad" onChangeText={setUnidad} placeholder="vasos, minutos, páginas…" placeholderTextColor="#8A839D" style={s.input} value={unidad} />{error && <Texto style={s.error}>{error}</Texto>}<View style={s.acciones}><Pressable onPress={onCerrar} style={s.secundario}><Texto style={s.secundarioTexto}>Cancelar</Texto></Pressable><Pressable disabled={guardando} onPress={guardar} style={s.primario}><Texto style={s.primarioTexto}>{guardando ? 'Guardando…' : 'Crear hábito'}</Texto></Pressable></View></View></View></Modal>;
}
const s = StyleSheet.create({ fondo: { alignItems: 'center', backgroundColor: 'rgba(26,19,53,.35)', flex: 1, justifyContent: 'flex-end' }, modal: { backgroundColor: '#F9F7FD', borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 22, width: '100%' }, titulo: { color: '#1A1335', fontFamily: 'Montserrat-Bold', fontSize: 23 }, sub: { color: '#7B7494', fontSize: 13, marginBottom: 13 }, input: { backgroundColor: '#FFFFFF', borderColor: '#E7E1F1', borderRadius: 13, borderWidth: 1, color: '#1A1335', fontFamily: 'Montserrat-Medium', marginTop: 9, padding: 13 }, error: { color: '#DC2626', fontSize: 12, marginTop: 8 }, acciones: { flexDirection: 'row', gap: 10, marginTop: 17 }, primario: { alignItems: 'center', backgroundColor: '#7C3AED', borderRadius: 14, flex: 1, padding: 14 }, primarioTexto: { color: '#FFFFFF', fontFamily: 'Montserrat-Bold' }, secundario: { alignItems: 'center', borderColor: '#DCD5EB', borderRadius: 14, borderWidth: 1, flex: 1, padding: 14 }, secundarioTexto: { color: '#5D5578', fontFamily: 'Montserrat-Bold' } });
