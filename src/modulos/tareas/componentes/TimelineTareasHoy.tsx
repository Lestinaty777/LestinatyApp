import { Check, Sparkles } from 'lucide-react-native';
import { Pressable, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { MasterGlass, MasterIconBg, Texto } from '../../../diseno';
import { conAlfa } from '../../../diseno/tema/masterColor';
import { useEscala } from '../../../diseno/tema/MasterColorContext';
import type { EscalaMaster } from '../../../diseno/tema/escalaEsmeralda';
import { buscarIconoHabito } from '../../habitos/iconosHabitos';
import type { TareaHoyDetalle } from '../tareas.tipos';

// Lista de "Hoy" para tareas: a diferencia de TimelineHabitosHoy, acá no hay
// swipe a un sendero (Tareas todavía no tiene uno, ver plan Fase 7/8) — tocar
// la fila completa alterna directo (marcar/desmarcar), como un checklist.
//
// Los 4 tipos (simple/checklist/contador/cronómetro) hoy se completan todos
// igual, con un toque: la base de datos todavía no guarda una meta numérica
// por tarea (eso es de una fase posterior, cuando se construya el wizard con
// el paso propio de cada tipo) — mostrar un contador o cronómetro sin nada
// real detrás sería solo una fachada.
export function TimelineTareasHoy({ completandoId, onCompletar, tareas }: {
  completandoId: string | null;
  onCompletar: (tarea: TareaHoyDetalle) => void;
  tareas: TareaHoyDetalle[];
}) {
  const { t } = useTranslation();
  const s = useEstilosFila();
  if (tareas.length === 0) {
    return (
      <View style={s.vacio}>
        <Texto style={s.vacioTitulo}>{t('tareas.pantallaCompleta.todayEmptyTitle')}</Texto>
        <Texto style={s.vacioTexto}>{t('tareas.pantallaCompleta.todayEmptyDescription')}</Texto>
      </View>
    );
  }
  return (
    <View>
      {tareas.map((tarea, indice) => (
        <FilaTareaHoy
          completando={completandoId === tarea.id}
          esUltimo={indice === tareas.length - 1}
          key={tarea.id}
          onPress={() => onCompletar(tarea)}
          tarea={tarea}
        />
      ))}
    </View>
  );
}

function FilaTareaHoy({ completando, esUltimo, onPress, tarea }: { completando: boolean; esUltimo: boolean; onPress: () => void; tarea: TareaHoyDetalle }) {
  const esc = useEscala();
  const s = useEstilosFila();
  const { t } = useTranslation();
  const icono = buscarIconoHabito(tarea.iconoLucide);
  const color = tarea.color ?? '#1A1335';
  const meta = tarea.frecuencia === 'dias_semana' && tarea.racha > 0
    ? t('tareas.pantallaCompleta.streakDays', { count: tarea.racha })
    : t('tareas.pantallaCompleta.oneTime');

  return (
    <View style={s.fila}>
      <View style={s.nodoColumna}>
        <View style={[s.nodo, tarea.completada ? s.nodoCompletado : s.nodoPendiente]}>
          {tarea.completada ? <Check color="#FFFFFF" size={13} strokeWidth={3} /> : null}
        </View>
        {!esUltimo && <View style={s.nodoLinea} />}
      </View>
      <Pressable disabled={completando} onPress={onPress} style={s.tarjetaContenedor}>
        <MasterGlass style={[s.tarjeta, completando && s.tarjetaOcupada]}>
          <View style={{ flex: 1 }}>
            <Texto numberOfLines={1} style={[s.titulo, tarea.completada && s.tituloCompletado]}>{tarea.titulo}</Texto>
            <Texto numberOfLines={1} style={s.subtitulo}>{meta}</Texto>
          </View>
          <View style={[s.chevron, { backgroundColor: conAlfa(esc.jade.l34, 0.1) }]}>
            {tarea.completada ? <Check color={esc.jade.l34} size={15} strokeWidth={3} /> : null}
          </View>
        </MasterGlass>
        <View style={s.iconoFlotante}><MasterIconBg fuente={icono?.fuente} size={48}>{!icono && <Sparkles color={color} size={20} />}</MasterIconBg></View>
      </Pressable>
    </View>
  );
}

const crearEstilos = (esc: EscalaMaster) => StyleSheet.create({
  fila: { flexDirection: 'row' },
  nodoColumna: { alignItems: 'center', marginRight: 10, width: 28 },
  nodo: { alignItems: 'center', borderRadius: 14, height: 28, justifyContent: 'center', width: 28, zIndex: 1 },
  nodoCompletado: { backgroundColor: esc.jade.l50 },
  nodoPendiente: { backgroundColor: '#FFFFFF', borderColor: conAlfa(esc.jade.l34, 0.25), borderWidth: 2 },
  nodoLinea: { backgroundColor: conAlfa(esc.jade.l34, 0.2), bottom: -8, position: 'absolute', top: 28, width: 2 },
  tarjetaContenedor: { flex: 1, marginBottom: 9, position: 'relative' },
  tarjeta: { alignItems: 'center', borderRadius: 14, flexDirection: 'row', gap: 8, paddingLeft: 66, paddingRight: 6, paddingVertical: 6 },
  tarjetaOcupada: { opacity: 0.6 },
  iconoFlotante: { left: 6, marginTop: -24, position: 'absolute', top: '50%', zIndex: 2 },
  titulo: { color: esc.hoja.l19, fontFamily: 'Montserrat-Bold', fontSize: 13, lineHeight: 15 },
  tituloCompletado: { color: esc.musgo.l49, textDecorationLine: 'line-through' },
  subtitulo: { color: esc.musgo.l49, fontFamily: 'Montserrat-Medium', fontSize: 11, lineHeight: 14, marginTop: 0 },
  chevron: { alignItems: 'center', borderRadius: 14, height: 28, justifyContent: 'center', width: 28 },
  vacio: { alignItems: 'center', paddingVertical: 24 },
  vacioTitulo: { color: esc.hoja.l19, fontFamily: 'MontserratAlternates-Bold', fontSize: 15, textAlign: 'center' },
  vacioTexto: { color: esc.musgo.l49, fontFamily: 'Montserrat-Medium', fontSize: 12, marginTop: 4, textAlign: 'center' },
});

const estilosPorEscala = new WeakMap<EscalaMaster, ReturnType<typeof crearEstilos>>();
function useEstilosFila() {
  const esc = useEscala();
  let valor = estilosPorEscala.get(esc);
  if (!valor) { valor = crearEstilos(esc); estilosPorEscala.set(esc, valor); }
  return valor;
}
