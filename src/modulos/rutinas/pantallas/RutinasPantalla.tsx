import React, { useState } from 'react';
import { View, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ChevronLeft, Dumbbell, Moon, Check } from 'lucide-react-native';
import { RecuadroGlass, Texto } from '../../../diseno';
import { hapticSeguro } from '../../../nucleo/dispositivo/haptics';

const D = {
  fondo:      '#0D0F1A',
  texto:      '#F0F2FF',
  textoSuave: '#8A90B4',
  verde:      '#4ADE80',
  rojo:       '#EF4444',
  rojoOscuro: '#7F1D1D',
  gema:       '#818CF8',
} as const;

type Filtro = 'hoy' | 'semana' | 'todas';
const FILTROS: { key: Filtro; label: string }[] = [
  { key: 'hoy',    label: 'Hoy'    },
  { key: 'semana', label: 'Semana' },
  { key: 'todas',  label: 'Todas'  },
];

const RUTINAS = [
  { id: '1', Icono: Dumbbell, colorIcono: D.rojo, titulo: 'Entrenamiento',   sub: '30 min', completada: true  },
  { id: '2', Icono: Moon,     colorIcono: D.gema, titulo: 'Rutina nocturna', sub: '20 min', completada: false },
];

export function RutinasPantalla() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [filtro, setFiltro] = useState<Filtro>('hoy');

  return (
    <View style={[s.raiz, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => { hapticSeguro('seleccion'); router.back(); }} style={s.backBtn}>
          <ChevronLeft size={26} color={D.texto} />
        </TouchableOpacity>
        <View style={s.headerCentro}>
          <Texto style={s.titulo}>Rutinas</Texto>
          <Texto style={s.subtitulo}>Construye la mejor versión de ti.</Texto>
        </View>
        <View style={s.backBtn} />
      </View>

      <ScrollView contentContainerStyle={[s.scroll, { paddingBottom: insets.bottom + 100 }]} showsVerticalScrollIndicator={false}>
        {/* Hero */}
        <View style={[s.hero, { backgroundColor: '#1A0505' }]}>
          <Texto style={s.heroEmoji}>💪</Texto>
          <Texto style={s.heroLabel}>Asset isométrico — Rutinas</Texto>
        </View>

        {/* Filtros */}
        <View style={s.filtrosRow}>
          {FILTROS.map(({ key, label }) => (
            <TouchableOpacity key={key} onPress={() => { hapticSeguro('seleccion'); setFiltro(key); }} activeOpacity={0.8} style={{ flex: 1 }}>
              <RecuadroGlass modo="dark" blur style={[s.pill, filtro === key && { backgroundColor: D.rojo }]}>
                <Texto style={[s.pillTexto, { color: filtro === key ? '#FFFFFF' : D.textoSuave }]}>{label}</Texto>
              </RecuadroGlass>
            </TouchableOpacity>
          ))}
        </View>

        {/* Progreso */}
        <Texto style={s.progresoLabel}>1/2 completadas</Texto>
        <View style={s.barraFondo}>
          <View style={[s.barraRelleno, { width: '50%', backgroundColor: D.rojo }]} />
        </View>

        {/* Lista */}
        <View style={s.lista}>
          {RUTINAS.map(({ id, Icono, colorIcono, titulo, sub, completada }) => (
            <TouchableOpacity key={id} onPress={() => hapticSeguro('seleccion')} activeOpacity={0.8}>
              <RecuadroGlass modo="dark" blur style={s.itemCard}>
                <View style={[s.itemIconoBg, { backgroundColor: `${colorIcono}20` }]}>
                  <Icono size={22} color={colorIcono} />
                </View>
                <View style={s.itemTextos}>
                  <Texto style={s.itemTitulo}>{titulo}</Texto>
                  <Texto style={s.itemSub}>{sub}</Texto>
                </View>
                <View style={[s.estadoCirculo, completada && s.estadoCompleto]}>
                  {completada && <Check size={13} color="#FFF" strokeWidth={3} />}
                </View>
              </RecuadroGlass>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      {/* FAB */}
      <TouchableOpacity onPress={() => hapticSeguro('accion')} activeOpacity={0.85}
        style={[s.fab, { bottom: insets.bottom + 24 }]}>
        <Texto style={[s.fabTexto, { color: D.rojo }]}>+ Añadir rutina</Texto>
      </TouchableOpacity>
    </View>
  );
}

const s = StyleSheet.create({
  raiz:          { flex: 1, backgroundColor: D.fondo },
  header:        { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12 },
  backBtn:       { width: 40, alignItems: 'flex-start' },
  headerCentro:  { flex: 1, alignItems: 'center' },
  titulo:        { fontFamily: 'MontserratAlternates-Bold', fontSize: 22, color: D.texto },
  subtitulo:     { fontFamily: 'Montserrat-Medium', fontSize: 13, color: D.textoSuave, marginTop: 2 },
  scroll:        { paddingHorizontal: 16, paddingTop: 8 },
  hero:          { height: 200, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginBottom: 20, gap: 8 },
  heroEmoji:     { fontSize: 72 },
  heroLabel:     { fontFamily: 'Montserrat-Medium', fontSize: 13, color: D.textoSuave },
  filtrosRow:    { flexDirection: 'row', gap: 10, marginBottom: 20 },
  pill:          { paddingHorizontal: 18, paddingVertical: 8, borderRadius: 50, alignItems: 'center' },
  pillTexto:     { fontFamily: 'Montserrat-Bold', fontSize: 13 },
  progresoLabel: { fontFamily: 'Montserrat-Medium', fontSize: 13, color: D.textoSuave, marginBottom: 8 },
  barraFondo:    { height: 4, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.1)', overflow: 'hidden', marginBottom: 20 },
  barraRelleno:  { height: 4, borderRadius: 2 },
  lista:         { gap: 12 },
  itemCard:      { flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 16, gap: 14 },
  itemIconoBg:   { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  itemTextos:    { flex: 1 },
  itemTitulo:    { fontFamily: 'Montserrat-Bold', fontSize: 15, color: D.texto },
  itemSub:       { fontFamily: 'Montserrat-Medium', fontSize: 12, color: D.textoSuave, marginTop: 2 },
  estadoCirculo: { width: 28, height: 28, borderRadius: 14, borderWidth: 2, borderColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
  estadoCompleto:{ backgroundColor: D.verde, borderColor: D.verde },
  fab:           { position: 'absolute', left: 20, right: 20, height: 52, borderRadius: 16, backgroundColor: D.rojoOscuro, borderWidth: 1, borderColor: 'rgba(239,68,68,0.4)', alignItems: 'center', justifyContent: 'center' },
  fabTexto:      { fontFamily: 'MontserratAlternates-Bold', fontSize: 15 },
});
