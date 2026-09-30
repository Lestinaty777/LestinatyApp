import { Check, Repeat, Sparkles } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { MasterChip, MasterGlass, MasterIconBg, Texto } from '../../../diseno';
import { useEscala } from '../../../diseno/tema/MasterColorContext';
import type { EscalaMaster } from '../../../diseno/tema/escalaEsmeralda';
import { buscarIconoHabito } from '../../habitos/iconosHabitos';
import type { PrioridadTarea, Tarea } from '../tareas.tipos';

type Vista = 'lista' | 'kanban' | 'eisenhower';

const COLUMNAS_KANBAN: { id: string; clave: string }[] = [
  { id: 'por_hacer', clave: 'porHacer' },
  { id: 'en_progreso', clave: 'enProgreso' },
  { id: 'hecho', clave: 'hecho' },
];

const CUADRANTES_EISENHOWER: { id: PrioridadTarea | 'sin_prioridad'; clave: string }[] = [
  { id: 'urgente_importante', clave: 'urgenteImportante' },
  { id: 'urgente_no_importante', clave: 'urgenteNoImportante' },
  { id: 'no_urgente_importante', clave: 'noUrgenteImportante' },
  { id: 'no_urgente_no_importante', clave: 'noUrgenteNoImportante' },
  { id: 'sin_prioridad', clave: 'sinPrioridad' },
];

// "Mis tareas": Kanban y Eisenhower NO son tipos de tarea (ver plan) — son dos
// formas más de AGRUPAR la misma lista, conmutables acá. Sin arrastrar ni
// re-priorizar todavía (de eso se ocuparía una pantalla de detalle/edición
// que esta fase no incluye): son vistas de solo lectura sobre columna_kanban/
// prioridad, más el toggle de completar para las tareas 'una_vez'.
export function ListaMisTareas({ completandoId, onCompletarUnaVez, tareas }: {
  completandoId: string | null;
  onCompletarUnaVez: (tarea: Tarea) => void;
  tareas: Tarea[];
}) {
  const { t } = useTranslation();
  const s = useEstilosFila();
  const [vista, setVista] = useState<Vista>('lista');

  const grupos = useMemo(() => {
    if (vista === 'kanban') {
      return COLUMNAS_KANBAN.map((columna) => ({
        clave: columna.clave,
        tareas: tareas.filter((tarea) => (tarea.columnaKanban ?? 'por_hacer') === columna.id),
      }));
    }
    if (vista === 'eisenhower') {
      return CUADRANTES_EISENHOWER.map((cuadrante) => ({
        clave: cuadrante.clave,
        tareas: tareas.filter((tarea) => (tarea.prioridad ?? 'sin_prioridad') === cuadrante.id),
      })).filter((grupo) => grupo.tareas.length > 0);
    }
    return [{ clave: null, tareas }];
  }, [tareas, vista]);

  if (tareas.length === 0) {
    return <Texto style={s.vacio}>{t('tareas.pantalla.vacioTitulo')}</Texto>;
  }

  return (
    <View>
      <View style={s.selectorVista}>
        {(['lista', 'kanban', 'eisenhower'] as const).map((opcion) => (
          <MasterChip activo={vista === opcion} key={opcion} onPress={() => setVista(opcion)} texto={t(`tareas.pantallaCompleta.view.${opcion}`)} />
        ))}
      </View>
      {grupos.map((grupo) => (
        <View key={grupo.clave ?? 'todas'} style={s.grupo}>
          {grupo.clave && <Texto style={s.grupoTitulo}>{t(`tareas.pantallaCompleta.${vista === 'kanban' ? 'kanban' : 'eisenhower'}.${grupo.clave}`)} · {grupo.tareas.length}</Texto>}
          {grupo.tareas.map((tarea) => (
            <FilaTarea completando={completandoId === tarea.id} key={tarea.id} onPress={() => tarea.frecuencia === 'una_vez' && onCompletarUnaVez(tarea)} tarea={tarea} />
          ))}
        </View>
      ))}
    </View>
  );
}

function FilaTarea({ completando, onPress, tarea }: { completando: boolean; onPress: () => void; tarea: Tarea }) {
  const esc = useEscala();
  const s = useEstilosFila();
  const { t } = useTranslation();
  const icono = buscarIconoHabito(tarea.iconoLucide);
  const color = tarea.color ?? '#1A1335';
  const completada = tarea.estado === 'hecha';
  const puedeCompletar = tarea.frecuencia === 'una_vez';

  return (
    <Pressable disabled={completando || !puedeCompletar} onPress={onPress} style={s.fila}>
      <MasterGlass style={[s.filaGlass, completando && s.filaOcupada]}>
        <MasterIconBg fuente={icono?.fuente} size={40}>{!icono && <Sparkles color={color} size={18} />}</MasterIconBg>
        <View style={{ flex: 1 }}>
          <Texto numberOfLines={1} style={[s.titulo, completada && s.tituloCompletado]}>{tarea.titulo}</Texto>
          {tarea.frecuencia === 'dias_semana' && (
            <View style={s.repiteFila}><Repeat color={esc.musgo.l49} size={11} /><Texto style={s.repiteTexto}>{t('tareas.pantallaCompleta.repeats')}</Texto></View>
          )}
        </View>
        {puedeCompletar && (
          <View style={[s.check, completada && { backgroundColor: esc.jade.l50 }]}>
            {completada && <Check color="#FFFFFF" size={13} strokeWidth={3} />}
          </View>
        )}
      </MasterGlass>
    </Pressable>
  );
}

const crearEstilos = (esc: EscalaMaster) => StyleSheet.create({
  selectorVista: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  grupo: { marginBottom: 14 },
  grupoTitulo: { color: esc.musgo.l49, fontFamily: 'Montserrat-Bold', fontSize: 11, marginBottom: 6, textTransform: 'uppercase' },
  vacio: { color: esc.musgo.l49, paddingVertical: 18, textAlign: 'center' },
  fila: { marginBottom: 8 },
  filaGlass: { alignItems: 'center', borderRadius: 16, flexDirection: 'row', gap: 10, padding: 10 },
  filaOcupada: { opacity: 0.6 },
  titulo: { color: esc.hoja.l19, fontFamily: 'Montserrat-Bold', fontSize: 13 },
  tituloCompletado: { color: esc.musgo.l49, textDecorationLine: 'line-through' },
  repiteFila: { alignItems: 'center', flexDirection: 'row', gap: 4, marginTop: 2 },
  repiteTexto: { color: esc.musgo.l49, fontFamily: 'Montserrat-Medium', fontSize: 10 },
  check: { alignItems: 'center', borderColor: esc.musgo.l70, borderRadius: 12, borderWidth: 2, height: 24, justifyContent: 'center', width: 24 },
});

const estilosPorEscala = new WeakMap<EscalaMaster, ReturnType<typeof crearEstilos>>();
function useEstilosFila() {
  const esc = useEscala();
  let valor = estilosPorEscala.get(esc);
  if (!valor) { valor = crearEstilos(esc); estilosPorEscala.set(esc, valor); }
  return valor;
}
