import { ArrowDown } from 'lucide-react-native';
import { StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { MasterAnimation, MasterGlass, MasterIcon, MasterIconBg, Texto } from '../../../diseno';
import { SeccionProgresoDatos } from '../../insights/componentes/SeccionProgresoDatos';
import { useEscala } from '../../../diseno/tema/MasterColorContext';
import type { EscalaMaster } from '../../../diseno/tema/escalaEsmeralda';
import { buscarIconoHabito } from '../../habitos/iconosHabitos';
import type { EstadoPanelTareas, ProgresoSeccionPanelTareas, RiesgoTarea } from '../tareas.tipos';

const ROJO = '#DC2626';

// Adaptado de SeccionRiesgo (InsightsPantalla.tsx) para RiesgoTarea en vez de
// RiesgoHabito — mismo formato de lista. Ver SeccionPatronesTareas.tsx sobre
// por qué se duplica en vez de reusar el original.
export function SeccionRiesgoTareas({ datos, estado, progreso }: { datos: RiesgoTarea[]; estado: EstadoPanelTareas; progreso: ProgresoSeccionPanelTareas }) {
  const { t } = useTranslation();
  const s = useEstilosS();

  return (
    <MasterGlass style={s.seccionColumna}>
      <View style={s.seccionHeaderCompacto}>
        <MasterIconBg size={32}><MasterIcon color={5} name="estadistica" size={16} /></MasterIconBg>
        <Texto style={s.seccionTituloCompacto}>{t('tareas.insights.risk.title')}</Texto>
      </View>
      <Texto style={s.seccionSubtituloCompacto}>{t('tareas.insights.risk.subtitle')}</Texto>
      {estado !== 'listo' ? (
        <SeccionProgresoDatos mensaje={t('tareas.insights.risk.needMoreHistory')} progreso={progreso} />
      ) : datos.length === 0 ? (
        <View style={s.estadoContenedor}><Texto style={s.estadoTexto}>{t('tareas.insights.risk.empty')}</Texto></View>
      ) : (
        <View style={s.listaCompacta}>
          <MasterAnimation>
            {datos.slice(0, 3).map((riesgo, i) => {
              const icono = buscarIconoHabito(riesgo.iconoLucide);
              return (
                <View key={`${riesgo.tareaId}-${i}`} style={s.filaSimple}>
                  {icono ? <MasterIcon name={icono.id} size={18} /> : <View style={[s.puntoColor, { backgroundColor: riesgo.color ?? '#1A1335' }]} />}
                  <Texto numberOfLines={1} style={s.filaSimpleTitulo}>{riesgo.titulo}</Texto>
                  <ArrowDown color={ROJO} size={14} strokeWidth={3} />
                </View>
              );
            })}
          </MasterAnimation>
        </View>
      )}
    </MasterGlass>
  );
}

const crearEstilos = (esc: EscalaMaster) => StyleSheet.create({
  seccionColumna: { borderRadius: 20, gap: 4, marginBottom: 12, padding: 14 },
  seccionHeaderCompacto: { alignItems: 'center', flexDirection: 'row', gap: 10, marginBottom: 6 },
  seccionTituloCompacto: { color: esc.hoja.l19, fontFamily: 'MontserratAlternates-Bold', fontSize: 14 },
  seccionSubtituloCompacto: { color: esc.musgo.l49, fontFamily: 'Montserrat-Medium', fontSize: 11 },
  listaCompacta: { gap: 10, marginTop: 8 },
  filaSimple: { alignItems: 'center', flexDirection: 'row', gap: 8 },
  filaSimpleTitulo: { color: esc.hoja.l19, flex: 1, fontFamily: 'Montserrat-Bold', fontSize: 13 },
  puntoColor: { borderRadius: 9, height: 18, width: 18 },
  estadoContenedor: { paddingVertical: 12 },
  estadoTexto: { color: esc.musgo.l49, fontFamily: 'Montserrat-Medium', fontSize: 12, textAlign: 'center' },
});

const estilosPorEscala = new WeakMap<EscalaMaster, ReturnType<typeof crearEstilos>>();
function useEstilosS() {
  const esc = useEscala();
  let valor = estilosPorEscala.get(esc);
  if (!valor) { valor = crearEstilos(esc); estilosPorEscala.set(esc, valor); }
  return valor;
}
