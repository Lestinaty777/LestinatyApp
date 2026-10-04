import { ChevronRight, Check, FolderOpen } from 'lucide-react-native';
import { Pressable, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { MasterGlass, MasterIconBg, Texto } from '../../../diseno';
import { conAlfa } from '../../../diseno/tema/masterColor';
import { useEscala, useTonoMaster } from '../../../diseno/tema/MasterColorContext';
import type { EscalaMaster } from '../../../diseno/tema/escalaEsmeralda';
import { obtenerAssetsPaquete } from '../../senderos/algoritmo/registroPaquetesArbol';
import { calcularNivelPlan, calcularRitmoPlan } from '../progresoPlan';
import type { ResumenPlan } from '../planes.tipos';

// Fork de TimelineTareasHoy.tsx (mismo lenguaje visual: nodo+línea a la
// izquierda, tarjeta glass con ícono flotante) adaptado a Planes — acá no
// hay nada que "completar" de un toque en la fila (eso pasa adentro de un
// plan, ítem por ítem), así que no hay versión expandible ni nodo con acción
// propia: toda la fila navega al detalle del plan.
//
// Sin acento propio hardcodeado: este componente solo se renderiza dentro
// del TonoDelHabito de Planes (aurelia) que arma TareasPantalla.tsx, así que
// useTonoMaster() ya resuelve al acento correcto solo.
export function TimelinePlanesHoy({ onAbrirPlan, planes }: {
  onAbrirPlan: (plan: ResumenPlan) => void;
  planes: ResumenPlan[];
}) {
  const { t } = useTranslation();
  const { acento } = useTonoMaster();
  const s = useEstilosFila(acento);
  if (planes.length === 0) {
    return (
      <View style={s.vacio}>
        <Texto style={s.vacioTitulo}>{t('planes.pantalla.vacioTitulo')}</Texto>
        <Texto style={s.vacioTexto}>{t('planes.pantalla.vacioDescripcion')}</Texto>
      </View>
    );
  }
  return (
    <View>
      {planes.map((plan, indice) => (
        <FilaPlanHoy esUltimo={indice === planes.length - 1} key={plan.id} onPress={() => onAbrirPlan(plan)} plan={plan} />
      ))}
    </View>
  );
}

function FilaPlanHoy({ esUltimo, onPress, plan }: { esUltimo: boolean; onPress: () => void; plan: ResumenPlan }) {
  const esc = useEscala();
  const { acento } = useTonoMaster();
  const s = useEstilosFila(acento);
  const { t } = useTranslation();
  const nivel = calcularNivelPlan(plan.completadas, plan.total);
  const ritmo = calcularRitmoPlan({ completadas: plan.completadas, creadoEn: plan.creadoEn, fechaObjetivo: plan.fechaObjetivo, total: plan.total });
  const completado = plan.estado === 'completado';
  const arbol = plan.paqueteId ? obtenerAssetsPaquete(plan.paqueteId)?.etapas[nivel - 1] : undefined;
  const meta = `${t('planes.tarjeta.progreso', { completadas: plan.completadas, total: plan.total })}${ritmo === 'sin_fecha' ? '' : ` · ${t(`planes.ritmo.${ritmo}`)}`}`;

  return (
    <View style={s.fila}>
      <View style={s.nodoColumna}>
        <Pressable accessibilityLabel={plan.titulo} accessibilityRole="button" onPress={onPress} style={s.nodoPressable}>
          <View style={[s.nodo, completado ? s.nodoCompletado : s.nodoPendiente]}>
            {completado ? <Check color="#FFFFFF" size={13} strokeWidth={3} /> : <Texto style={[s.nodoNivelTexto, { color: acento }]}>{nivel}</Texto>}
          </View>
        </Pressable>
        {!esUltimo && <View style={s.nodoLinea} />}
      </View>
      <View style={s.tarjetaContenedor}>
        <Pressable onPress={onPress} style={{ position: 'relative' }}>
          <MasterGlass style={s.tarjeta}>
            <View style={{ flex: 1 }}>
              <Texto numberOfLines={1} style={s.titulo}>{plan.titulo}</Texto>
              <Texto numberOfLines={1} style={s.subtitulo}>{meta}</Texto>
            </View>
            <View style={[s.chevron, { backgroundColor: conAlfa(esc.jade.l34, 0.1) }]}>
              <ChevronRight color={esc.jade.l34} size={15} strokeWidth={2.5} />
            </View>
          </MasterGlass>
          <View style={s.iconoFlotante}>
            <MasterIconBg colorBordeFin={acento} colorBordeInicio={acento} fuente={arbol} size={48} tinte={conAlfa(acento, 0.2)}>
              {!arbol && <FolderOpen color={acento} size={20} />}
            </MasterIconBg>
          </View>
        </Pressable>
      </View>
    </View>
  );
}

const crearEstilos = (esc: EscalaMaster, acento: string) => StyleSheet.create({
  fila: { flexDirection: 'row' },
  nodoColumna: { alignItems: 'center', marginRight: 10, width: 28, zIndex: 2 },
  nodoPressable: { zIndex: 2 },
  nodo: { alignItems: 'center', borderRadius: 14, height: 28, justifyContent: 'center', width: 28, zIndex: 2 },
  nodoCompletado: { backgroundColor: acento },
  nodoPendiente: { backgroundColor: '#FFFFFF', borderColor: conAlfa(acento, 0.3), borderWidth: 2 },
  nodoNivelTexto: { fontFamily: 'Montserrat-Bold', fontSize: 11 },
  nodoLinea: { backgroundColor: conAlfa(acento, 0.2), bottom: -8, position: 'absolute', top: 28, width: 2 },
  tarjetaContenedor: { flex: 1, marginBottom: 9 },
  tarjeta: { alignItems: 'center', borderRadius: 14, flexDirection: 'row', gap: 8, paddingLeft: 66, paddingRight: 6, paddingVertical: 6 },
  iconoFlotante: { left: 6, marginTop: -24, position: 'absolute', top: '50%', zIndex: 2 },
  titulo: { color: esc.hoja.l19, fontFamily: 'Montserrat-Bold', fontSize: 13, lineHeight: 15 },
  subtitulo: { color: esc.musgo.l49, fontFamily: 'Montserrat-Medium', fontSize: 11, lineHeight: 14, marginTop: 0 },
  chevron: { alignItems: 'center', borderRadius: 14, height: 28, justifyContent: 'center', width: 28 },
  vacio: { alignItems: 'center', paddingVertical: 24 },
  vacioTitulo: { color: esc.hoja.l19, fontFamily: 'MontserratAlternates-Bold', fontSize: 15, textAlign: 'center' },
  vacioTexto: { color: esc.musgo.l49, fontFamily: 'Montserrat-Medium', fontSize: 12, marginTop: 4, textAlign: 'center' },
});

// Caché de dos niveles (esc, luego acento) — el acento puede cambiar sin que
// cambie la escala (ninguno de los dos casos pasa hoy, pero deja la caché
// correcta en vez de asumir que siempre van a cambiar juntos).
const estilosPorEscala = new WeakMap<EscalaMaster, Map<string, ReturnType<typeof crearEstilos>>>();
function useEstilosFila(acento: string) {
  const esc = useEscala();
  let porAcento = estilosPorEscala.get(esc);
  if (!porAcento) { porAcento = new Map(); estilosPorEscala.set(esc, porAcento); }
  let valor = porAcento.get(acento);
  if (!valor) { valor = crearEstilos(esc, acento); porAcento.set(acento, valor); }
  return valor;
}
