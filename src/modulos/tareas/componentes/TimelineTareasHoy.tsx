import { useState } from 'react';
import { Check, ChevronDown, ChevronUp, Sparkles } from 'lucide-react-native';
import { Pressable, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import Animated, { FadeInDown, FadeOut } from 'react-native-reanimated';

import { MasterGlass, MasterIconBg, Texto } from '../../../diseno';
import { conAlfa } from '../../../diseno/tema/masterColor';
import { useEscala } from '../../../diseno/tema/MasterColorContext';
import type { EscalaMaster } from '../../../diseno/tema/escalaEsmeralda';
import { buscarIconoHabito } from '../../habitos/iconosHabitos';
import { WidgetProgresoTarea } from './WidgetProgresoTarea';
import type { TareaHoyDetalle } from '../tareas.tipos';

// Lista de "Hoy" para tareas: a diferencia de TimelineHabitosHoy, acá no hay
// swipe a un sendero — tocar la fila completa alterna directo (marcar/
// desmarcar), como un checklist. Única excepción: contador y cronómetro —
// cualquier frecuencia, el wizard deja poner meta numérica en los dos casos —
// ahí tocar la fila expande WidgetProgresoTarea en vez de completar de un
// toque. El widget siempre persiste de verdad (onRegistrarProgreso); a qué
// RPC apunta según la frecuencia es decisión de TareasPantalla.tsx
// (usaSenderoDeDias/usaProgresoUnaVez), este componente no necesita saberlo.
function esExpandible(tipo: TareaHoyDetalle['tipo']): boolean {
  return tipo === 'contador' || tipo === 'cronometro';
}

export function TimelineTareasHoy({ completandoId, etiquetasRutina, onCompletar, onRegistrarProgreso, tareas }: {
  /** "En Rutina X" por id de tarea; opcional para no obligar a quien no lo necesita. */
  etiquetasRutina?: Map<string, string>;
  completandoId: string | null;
  onCompletar: (tarea: TareaHoyDetalle) => void;
  onRegistrarProgreso: (tarea: TareaHoyDetalle, valor: number) => void;
  tareas: TareaHoyDetalle[];
}) {
  const { t } = useTranslation();
  const s = useEstilosFila();
  const [expandidoId, setExpandidoId] = useState<string | null>(null);
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
      {tareas.map((tarea, indice) => {
        const expandible = esExpandible(tarea.tipo);
        return (
          <FilaTareaHoy
            completando={completandoId === tarea.id}
            esUltimo={indice === tareas.length - 1}
            etiquetaRutina={etiquetasRutina?.get(tarea.id)}
            expandible={expandible}
            expandido={expandible && expandidoId === tarea.id}
            key={tarea.id}
            onPress={() => {
              if (expandible) setExpandidoId((actual) => (actual === tarea.id ? null : tarea.id));
              else onCompletar(tarea);
            }}
            onPressNodo={() => onCompletar(tarea)}
            onRegistrarProgreso={(valor) => onRegistrarProgreso(tarea, valor)}
            tarea={tarea}
          />
        );
      })}
    </View>
  );
}

function FilaTareaHoy({ completando, esUltimo, etiquetaRutina, expandible, expandido, onPress, onPressNodo, onRegistrarProgreso, tarea }: {
  etiquetaRutina?: string;
  completando: boolean;
  esUltimo: boolean;
  expandible: boolean;
  expandido: boolean;
  onPress: () => void;
  onPressNodo: () => void;
  onRegistrarProgreso: (valor: number) => void;
  tarea: TareaHoyDetalle;
}) {
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
        <Pressable accessibilityLabel={t('tareas.pantallaCompleta.quickComplete')} accessibilityRole="button" disabled={completando} style={s.nodoPressable} onPress={onPressNodo}>
          <View style={[s.nodo, tarea.completada ? s.nodoCompletado : s.nodoPendiente]}>
            {tarea.completada ? <Check color="#FFFFFF" size={13} strokeWidth={3} /> : null}
          </View>
        </Pressable>
        {!esUltimo && <View style={s.nodoLinea} />}
      </View>
      <View style={s.tarjetaContenedor}>
        <Pressable disabled={completando} onPress={onPress} style={{ position: 'relative' }}>
          <MasterGlass style={[s.tarjeta, completando && s.tarjetaOcupada]}>
            <View style={{ flex: 1 }}>
              <Texto numberOfLines={1} style={[s.titulo, tarea.completada && s.tituloCompletado]}>{tarea.titulo}</Texto>
              <Texto numberOfLines={1} style={s.subtitulo}>{etiquetaRutina ? `${meta} · ${etiquetaRutina}` : meta}</Texto>
            </View>
            <View style={[s.chevron, { backgroundColor: conAlfa(esc.jade.l34, 0.1) }]}>
              {expandible ? (
                expandido ? <ChevronUp color={esc.jade.l34} size={15} strokeWidth={2.5} /> : <ChevronDown color={esc.jade.l34} size={15} strokeWidth={2.5} />
              ) : tarea.completada ? (
                <Check color={esc.jade.l34} size={15} strokeWidth={3} />
              ) : null}
            </View>
          </MasterGlass>
          <View style={s.iconoFlotante}><MasterIconBg fuente={icono?.fuente} size={48}>{!icono && <Sparkles color={color} size={20} />}</MasterIconBg></View>
        </Pressable>
        {expandido && (
          <Animated.View entering={FadeInDown.duration(220)} exiting={FadeOut.duration(140)} style={s.expandida}>
            <MasterGlass style={s.tarjetaExpandida}>
              <WidgetProgresoTarea
                color={tarea.color}
                guardando={completando}
                meta={tarea.objetivoValor}
                onGuardar={onRegistrarProgreso}
                tipo={tarea.tipo === 'cronometro' ? 'cronometro' : 'contador'}
                titulo={tarea.titulo}
                unidad={tarea.unidad}
                valorInicial={tarea.valorHoy}
              />
            </MasterGlass>
          </Animated.View>
        )}
      </View>
    </View>
  );
}

const crearEstilos = (esc: EscalaMaster) => StyleSheet.create({
  fila: { flexDirection: 'row' },
  nodoColumna: { alignItems: 'center', marginRight: 10, width: 28, zIndex: 2 },
  nodoPressable: { zIndex: 2 },
  nodo: { alignItems: 'center', borderRadius: 14, height: 28, justifyContent: 'center', width: 28, zIndex: 2 },
  nodoCompletado: { backgroundColor: esc.jade.l50 },
  nodoPendiente: { backgroundColor: '#FFFFFF', borderColor: conAlfa(esc.jade.l34, 0.25), borderWidth: 2 },
  nodoLinea: { backgroundColor: conAlfa(esc.jade.l34, 0.2), bottom: -8, position: 'absolute', top: 28, width: 2 },
  tarjetaContenedor: { flex: 1, marginBottom: 9 },
  tarjeta: { alignItems: 'center', borderRadius: 14, flexDirection: 'row', gap: 8, paddingLeft: 66, paddingRight: 6, paddingVertical: 6 },
  tarjetaOcupada: { opacity: 0.6 },
  iconoFlotante: { left: 6, marginTop: -24, position: 'absolute', top: '50%', zIndex: 2 },
  titulo: { color: esc.hoja.l19, fontFamily: 'Montserrat-Bold', fontSize: 13, lineHeight: 15 },
  tituloCompletado: { color: esc.musgo.l49, textDecorationLine: 'line-through' },
  subtitulo: { color: esc.musgo.l49, fontFamily: 'Montserrat-Medium', fontSize: 11, lineHeight: 14, marginTop: 0 },
  chevron: { alignItems: 'center', borderRadius: 14, height: 28, justifyContent: 'center', width: 28 },
  expandida: { marginTop: 6 },
  tarjetaExpandida: { borderRadius: 14, padding: 10 },
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
