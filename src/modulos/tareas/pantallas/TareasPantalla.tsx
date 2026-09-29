import { useState } from 'react';
import { Alert, FlatList, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Check, Columns, CalendarDays, LayoutGrid, List, Map, Plus, Clock, Trash2 } from 'lucide-react-native';

import { Rebote, Texto } from '../../../diseno';
import { hapticSeguro } from '../../../nucleo/dispositivo/haptics';
import { AuroraBoreal } from '../../hoy/componentes/AuroraBoreal';
import { ESCALA_ESMERALDA } from '../../../diseno/tema/escalaEsmeralda';
import { CrearTareaHoja } from '../componentes/CrearTareaHoja';
import { CLAVE_SEMILLAS_DISPONIBLES } from '../../tienda/pantallas/TiendaArbolesPantalla';
import { asignarSemillaTarea, crearTarea, completarTarea, eliminarTarea, obtenerTareas } from '../tareas.servicio';
import type { Tarea } from '../tareas.tipos';

const CLAVE_TAREAS = ['tareas', 'lista'];

const C = {
  fondo: '#FFFBEB',
  texto: '#1A1335',
  textoSecundario: '#7B7494',
  textoTenue: '#A8A1BD',
  morado: '#F59E0B',
  moradoSuave: '#FEF3C7',
  verde: ESCALA_ESMERALDA.jade.l70,
  verdeSuave: ESCALA_ESMERALDA.jade.l95,
  naranja: '#F97316',
  naranjaSuave: '#FFEDD5',
  rojo: '#EF4444',
  rojoSuave: '#FEE2E2',
  azul: '#3B82F6',
  azulSuave: '#DBEAFE',
};

const TABS = [
  { id: 'lista', label: 'Lista', color: C.morado, colorSuave: C.moradoSuave, Icono: List },
  { id: 'kanban', label: 'Kanban', color: C.azul, colorSuave: C.azulSuave, Icono: Columns },
  { id: 'agenda', label: 'Agenda', color: C.rojo, colorSuave: C.rojoSuave, Icono: CalendarDays },
  { id: 'eisenhower', label: 'Eisenhower', color: C.verde, colorSuave: C.verdeSuave, Icono: LayoutGrid },
  { id: 'senderos', label: 'Senderos', color: C.naranja, colorSuave: C.naranjaSuave, Icono: Map },
  { id: 'time', label: 'Time block', color: '#7B7494', colorSuave: '#EDE5FB', Icono: Clock },
] as const;

const PRIORIDAD_COLOR: Record<NonNullable<Tarea['prioridad']>, string> = {
  urgente_importante: C.rojo,
  urgente_no_importante: C.naranja,
  no_urgente_importante: C.azul,
  no_urgente_no_importante: C.textoTenue,
};

function FilaTarea({ onCompletar, onEliminar, tarea }: { onCompletar: (tarea: Tarea) => void; onEliminar: (tarea: Tarea) => void; tarea: Tarea }) {
  const hecha = tarea.estado === 'hecha';
  return (
    <View style={[s.fila, tarea.color ? { borderLeftColor: tarea.color, borderLeftWidth: 4 } : null]}>
      <Pressable accessibilityLabel="check" onPress={() => onCompletar(tarea)} style={[s.checkbox, hecha && { backgroundColor: C.texto, borderColor: C.texto }]}>
        {hecha ? <Check color="#FFFFFF" size={14} strokeWidth={3} /> : null}
      </Pressable>
      <View style={{ flex: 1 }}>
        <Texto numberOfLines={2} style={[s.filaTitulo, hecha && { color: C.textoTenue, textDecorationLine: 'line-through' }]}>{tarea.titulo}</Texto>
        <View style={{ flexDirection: 'row', gap: 8, marginTop: 3 }}>
          {tarea.fechaVencimiento ? <Texto style={s.filaMeta}>{tarea.fechaVencimiento}</Texto> : null}
          {tarea.prioridad ? <View style={[s.puntoPrioridad, { backgroundColor: PRIORIDAD_COLOR[tarea.prioridad] }]} /> : null}
        </View>
      </View>
      <Pressable accessibilityLabel="eliminar" hitSlop={10} onPress={() => onEliminar(tarea)}>
        <Trash2 color={C.textoTenue} size={18} />
      </Pressable>
    </View>
  );
}

export function TareasPantalla() {
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const cliente = useQueryClient();
  const [tabActiva, setTabActiva] = useState<(typeof TABS)[number]['id']>('lista');
  const [creando, setCreando] = useState(false);

  const consulta = useQuery({ queryKey: CLAVE_TAREAS, queryFn: obtenerTareas });

  const mutacionCrear = useMutation({
    mutationFn: async (input: { titulo: string; fechaVencimiento: string | null; prioridad: Tarea['prioridad']; semillaId: string | null; paqueteId: string | null }) => {
      const tarea = await crearTarea({ titulo: input.titulo, fechaVencimiento: input.fechaVencimiento, prioridad: input.prioridad, paqueteId: input.paqueteId });
      if (input.semillaId) await asignarSemillaTarea(input.semillaId, tarea.id);
      return tarea;
    },
    onError: () => Alert.alert(t('tareas.pantalla.errorCrear')),
    onSuccess: () => {
      hapticSeguro('confirmacion');
      cliente.invalidateQueries({ queryKey: CLAVE_TAREAS });
      cliente.invalidateQueries({ queryKey: CLAVE_SEMILLAS_DISPONIBLES });
      setCreando(false);
    },
  });

  const mutacionCompletar = useMutation({
    mutationFn: (tarea: Tarea) => completarTarea(tarea.id, tarea.estado !== 'hecha'),
    onSuccess: () => cliente.invalidateQueries({ queryKey: CLAVE_TAREAS }),
  });

  const mutacionEliminar = useMutation({
    mutationFn: (tarea: Tarea) => eliminarTarea(tarea.id),
    onSuccess: () => cliente.invalidateQueries({ queryKey: CLAVE_TAREAS }),
  });

  function confirmarEliminar(tarea: Tarea) {
    Alert.alert(t('tareas.pantalla.eliminarTitulo'), t('tareas.pantalla.eliminarDescripcion'), [
      { style: 'cancel', text: t('tareas.pantalla.cancelar') },
      { onPress: () => mutacionEliminar.mutate(tarea), style: 'destructive', text: t('tareas.pantalla.eliminar') },
    ]);
  }

  const tabInfo = TABS.find((tab) => tab.id === tabActiva)!;

  return (
    <View style={s.raiz}>
      <View pointerEvents="none" style={StyleSheet.absoluteFill}><AuroraBoreal tema="verde" /></View>
      <View style={{ paddingTop: insets.top + 12, paddingHorizontal: 20 }}>
        <Texto variante="titulo">{t('tareas.pantalla.titulo')}</Texto>
        <Texto style={{ color: C.textoSecundario, marginTop: 2 }}>{t('tareas.pantalla.subtitulo')}</Texto>
      </View>

      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 16, paddingHorizontal: 20 }}>
        {TABS.map((tab) => {
          const activa = tab.id === tabActiva;
          return (
            <Rebote key={tab.id} onPress={() => setTabActiva(tab.id)} estilo={[s.tab, { backgroundColor: activa ? tab.color : tab.colorSuave }]}>
              <tab.Icono color={activa ? '#FFFFFF' : tab.color} size={14} />
              <Texto style={[s.tabTexto, { color: activa ? '#FFFFFF' : tab.color }]}>{tab.label}</Texto>
            </Rebote>
          );
        })}
      </View>

      {tabActiva === 'lista' ? (
        <FlatList
          contentContainerStyle={{ gap: 10, paddingBottom: insets.bottom + 100, paddingHorizontal: 20, paddingTop: 16 }}
          data={consulta.data ?? []}
          keyExtractor={(tarea) => tarea.id}
          ListEmptyComponent={!consulta.isLoading ? (
            <View style={{ alignItems: 'center', paddingTop: 60 }}>
              <Texto style={{ color: C.texto, fontFamily: 'MontserratAlternates-Bold', fontSize: 16 }}>{t('tareas.pantalla.vacioTitulo')}</Texto>
              <Texto style={{ color: C.textoSecundario, marginTop: 4, textAlign: 'center' }}>{t('tareas.pantalla.vacioDescripcion')}</Texto>
            </View>
          ) : null}
          renderItem={({ item }) => <FilaTarea onCompletar={(tarea) => mutacionCompletar.mutate(tarea)} onEliminar={confirmarEliminar} tarea={item} />}
        />
      ) : (
        <View style={{ alignItems: 'center', flex: 1, justifyContent: 'center', paddingHorizontal: 40 }}>
          <View style={[s.proximamenteIcono, { backgroundColor: tabInfo.colorSuave }]}><tabInfo.Icono color={tabInfo.color} size={26} /></View>
          <Texto style={{ color: C.texto, fontFamily: 'MontserratAlternates-Bold', fontSize: 17, marginTop: 12, textAlign: 'center' }}>{t('tareas.pantalla.proximamente.titulo')}</Texto>
          <Texto style={{ color: C.textoSecundario, marginTop: 4, textAlign: 'center' }}>{t('tareas.pantalla.proximamente.descripcion')}</Texto>
        </View>
      )}

      <Pressable accessibilityLabel={t('tareas.pantalla.nuevaTarea')} onPress={() => { hapticSeguro('seleccion'); setCreando(true); }} style={[s.fab, { bottom: insets.bottom + 24 }]}>
        <Plus color="#FFFFFF" size={26} strokeWidth={2.5} />
      </Pressable>

      {creando && (
        <CrearTareaHoja
          guardando={mutacionCrear.isPending}
          onCerrar={() => setCreando(false)}
          onCrear={(input) => mutacionCrear.mutate(input)}
        />
      )}
    </View>
  );
}

const s = StyleSheet.create({
  raiz: { backgroundColor: C.fondo, flex: 1 },
  tab: { alignItems: 'center', borderRadius: 999, flexDirection: 'row', gap: 6, paddingHorizontal: 13, paddingVertical: 9 },
  tabTexto: { fontFamily: 'Montserrat-Bold', fontSize: 12 },
  fila: { alignItems: 'center', backgroundColor: '#FFFFFF', borderRadius: 16, flexDirection: 'row', gap: 12, padding: 14 },
  checkbox: { alignItems: 'center', borderColor: '#D1D5DB', borderRadius: 12, borderWidth: 2, height: 24, justifyContent: 'center', width: 24 },
  filaTitulo: { color: C.texto, fontFamily: 'Montserrat-Bold', fontSize: 14 },
  filaMeta: { color: C.textoSecundario, fontFamily: 'Montserrat-Medium', fontSize: 11 },
  puntoPrioridad: { borderRadius: 4, height: 8, width: 8 },
  fab: { alignItems: 'center', backgroundColor: C.texto, borderRadius: 30, elevation: 4, height: 58, justifyContent: 'center', position: 'absolute', right: 20, shadowColor: '#000', shadowOffset: { height: 3, width: 0 }, shadowOpacity: 0.25, shadowRadius: 8, width: 58 },
  proximamenteIcono: { alignItems: 'center', borderRadius: 32, height: 64, justifyContent: 'center', width: 64 },
});
