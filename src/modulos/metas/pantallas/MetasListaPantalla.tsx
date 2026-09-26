import React, { useState } from 'react';
import { View, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Target, Check } from 'lucide-react-native';
import { RecuadroGlass, Texto } from '../../../diseno';
import { hapticSeguro } from '../../../nucleo/dispositivo/haptics';

const D = {
  fondo:        '#0D0F1A',
  texto:        '#F0F2FF',
  textoSuave:   '#8A90B4',
  morado:       '#A855F7',
  moradoOscuro: '#581C87',
} as const;

type Tab = 'activas' | 'completadas' | 'archivadas';
const TABS: { key: Tab; label: string }[] = [
  { key: 'activas',      label: 'Activas'      },
  { key: 'completadas',  label: 'Completadas'  },
  { key: 'archivadas',   label: 'Archivadas'   },
];

const SUBTAREAS = [
  { label: 'Definir idea',    done: true  },
  { label: 'Diseñar UI',      done: false },
  { label: 'Desarrollar MVP', done: false },
  { label: 'Lanzar',          done: false },
];

export function MetasListaPantalla() {
  const insets = useSafeAreaInsets();
  const [tab, setTab] = useState<Tab>('activas');

  return (
    <View style={[s.raiz, { paddingTop: insets.top }]}>
      <ScrollView contentContainerStyle={[s.scroll, { paddingBottom: insets.bottom + 100 }]} showsVerticalScrollIndicator={false}>
        {/* Header centrado (sin back — es tab principal) */}
        <Texto style={s.titulo}>Metas</Texto>
        <Texto style={s.subtitulo}>Grandes sueños, acciones reales.</Texto>

        {/* Hero */}
        <View style={[s.hero, { backgroundColor: '#110820' }]}>
          <Texto style={s.heroEmoji}>🌟</Texto>
          <Texto style={s.heroLabel}>Asset isométrico — Metas</Texto>
        </View>

        {/* Tabs */}
        <View style={s.tabsRow}>
          {TABS.map(({ key, label }) => (
            <TouchableOpacity key={key} onPress={() => { hapticSeguro('seleccion'); setTab(key); }} activeOpacity={0.8} style={{ flex: 1 }}>
              <RecuadroGlass modo="dark" blur style={[s.tabPill, tab === key && { backgroundColor: D.morado }]}>
                <Texto style={[s.tabTexto, { color: tab === key ? '#FFFFFF' : D.textoSuave }]}>{label}</Texto>
              </RecuadroGlass>
            </TouchableOpacity>
          ))}
        </View>

        {/* Tarjeta meta */}
        <RecuadroGlass modo="dark" blur style={s.metaCard}>
          {/* Fila superior */}
          <View style={s.metaTopRow}>
            <View style={s.metaIconoBg}>
              <Target size={20} color={D.morado} />
            </View>
            <Texto style={s.metaTitulo}>Lanzar mi app</Texto>
            <Texto style={s.metaPorcentaje}>25%</Texto>
          </View>

          {/* Barra de progreso */}
          <View style={s.barraFondo}>
            <View style={[s.barraRelleno, { width: '25%' }]} />
          </View>

          {/* Subtareas */}
          <View style={s.subtareaLista}>
            {SUBTAREAS.map(({ label, done }) => (
              <View key={label} style={s.subtareaFila}>
                <View style={[s.checkbox, done && s.checkboxDone]}>
                  {done && <Check size={10} color="#FFF" strokeWidth={3} />}
                </View>
                <Texto style={[s.subtareaTexto, { color: done ? D.texto : D.textoSuave }]}>{label}</Texto>
              </View>
            ))}
          </View>
        </RecuadroGlass>

        {/* Cita */}
        <Texto style={s.cita}>"Todo gran logro comienza con un pequeño paso"</Texto>
      </ScrollView>

      {/* FAB */}
      <TouchableOpacity onPress={() => hapticSeguro('accion')} activeOpacity={0.85}
        style={[s.fab, { bottom: insets.bottom + 24 }]}>
        <Texto style={[s.fabTexto, { color: D.morado }]}>+ Nueva meta</Texto>
      </TouchableOpacity>
    </View>
  );
}

const s = StyleSheet.create({
  raiz:         { flex: 1, backgroundColor: D.fondo },
  scroll:       { paddingHorizontal: 20, paddingTop: 16 },
  titulo:       { fontFamily: 'MontserratAlternates-Bold', fontSize: 24, lineHeight: 29, color: D.texto, textAlign: 'center', marginBottom: 6 },
  subtitulo:    { fontFamily: 'Montserrat-Medium', fontSize: 13, color: D.textoSuave, textAlign: 'center', marginBottom: 24 },
  hero:         { height: 220, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginBottom: 24, gap: 8 },
  heroEmoji:    { fontSize: 72, lineHeight: 86 },
  heroLabel:    { fontFamily: 'Montserrat-Medium', fontSize: 13, color: D.textoSuave },
  tabsRow:      { flexDirection: 'row', gap: 8, marginBottom: 24 },
  tabPill:      { paddingVertical: 8, borderRadius: 50, alignItems: 'center' },
  tabTexto:     { fontFamily: 'Montserrat-Bold', fontSize: 12 },
  metaCard:     { borderRadius: 18, padding: 16, marginBottom: 14 },
  metaTopRow:   { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 },
  metaIconoBg:  { width: 36, height: 36, borderRadius: 18, backgroundColor: `${D.morado}22`, alignItems: 'center', justifyContent: 'center' },
  metaTitulo:   { flex: 1, fontFamily: 'MontserratAlternates-Bold', fontSize: 17, color: D.texto },
  metaPorcentaje:{ fontFamily: 'MontserratAlternates-Bold', fontSize: 15, color: D.morado },
  barraFondo:   { height: 4, borderRadius: 2, backgroundColor: `${D.morado}33`, overflow: 'hidden', marginBottom: 14 },
  barraRelleno: { height: 4, borderRadius: 2, backgroundColor: D.morado },
  subtareaLista:{ gap: 10, paddingTop: 2 },
  subtareaFila: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  checkbox:     { width: 18, height: 18, borderRadius: 4, borderWidth: 1.5, borderColor: `${D.morado}66`, alignItems: 'center', justifyContent: 'center' },
  checkboxDone: { backgroundColor: D.morado, borderColor: D.morado },
  subtareaTexto:{ fontFamily: 'Montserrat-Medium', fontSize: 13 },
  cita:         { fontFamily: 'Montserrat-Medium', fontSize: 12, color: D.textoSuave, fontStyle: 'italic', textAlign: 'center', paddingHorizontal: 8 },
  fab:          { position: 'absolute', left: 20, right: 20, height: 52, borderRadius: 16, backgroundColor: D.moradoOscuro, borderWidth: 1, borderColor: `${D.morado}66`, alignItems: 'center', justifyContent: 'center' },
  fabTexto:     { fontFamily: 'MontserratAlternates-Bold', fontSize: 15 },
});
