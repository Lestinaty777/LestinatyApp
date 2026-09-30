import { StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { MasterGlass, MasterIcon, MasterIconBg, Texto } from '../../../diseno';
import { SeccionProgresoDatos } from '../../insights/componentes/SeccionProgresoDatos';
import { useEscala } from '../../../diseno/tema/MasterColorContext';
import type { EscalaMaster } from '../../../diseno/tema/escalaEsmeralda';
import type { EstadoPanelTareas, PatronTarea, ProgresoSeccionPanelTareas } from '../tareas.tipos';

const DIAS_SEMANA_ETIQUETA = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];

// Adaptado de SeccionPatrones (InsightsPantalla.tsx) para PatronTarea en vez
// de PatronHabito — mismo gráfico de barras por día de semana. Se duplica en
// vez de reusar el original porque esa función es privada del archivo de
// Hábitos; ver el plan (Fase 5) sobre esta decisión.
export function SeccionPatronesTareas({ datos, estado, progreso }: { datos: PatronTarea[]; estado: EstadoPanelTareas; progreso: ProgresoSeccionPanelTareas }) {
  const { t } = useTranslation();
  const s = useEstilosS();
  const diasConDatos = datos.filter((item) => item.muestras > 0).length;

  return (
    <MasterGlass style={s.seccionColumna}>
      <View style={s.seccionHeaderCompacto}>
        <MasterIconBg size={32}><MasterIcon alTema name="calendario" size={16} /></MasterIconBg>
        <View style={{ flex: 1 }}>
          <Texto style={s.seccionTituloCompacto}>{t('tareas.insights.patterns.title')}</Texto>
          <Texto style={s.seccionSubtituloCompacto}>
            {estado === 'listo' ? t('tareas.insights.patterns.recordedDays', { count: diasConDatos }) : t('tareas.insights.patterns.gatheringHistory')}
          </Texto>
        </View>
      </View>
      {estado !== 'listo' ? (
        <SeccionProgresoDatos mensaje={t('tareas.insights.patterns.needMoreDays')} progreso={progreso} />
      ) : (
        <View style={s.barras}>
          {DIAS_SEMANA_ETIQUETA.map((etiqueta, indice) => {
            const patron = datos.find((item) => item.diaSemana === indice + 1);
            const porcentaje = Math.max(10, patron?.porcentaje ?? 0);
            return (
              <View key={indice} style={s.barraColumna}>
                <View style={s.barraFondo}><View style={[s.barraLlena, { height: `${porcentaje}%` }]} /></View>
                <Texto style={s.barraTexto}>{etiqueta}</Texto>
              </View>
            );
          })}
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
  barras: { flexDirection: 'row', gap: 4, height: 90, justifyContent: 'space-between', marginTop: 4 },
  barraColumna: { alignItems: 'center', flex: 1, gap: 4, justifyContent: 'flex-end' },
  barraFondo: { backgroundColor: `${esc.jade.l50}1A`, borderRadius: 6, flex: 1, justifyContent: 'flex-end', overflow: 'hidden', width: '85%' },
  barraLlena: { backgroundColor: esc.jade.l50, borderRadius: 6, width: '100%' },
  barraTexto: { color: esc.musgo.l49, fontFamily: 'Montserrat-Medium', fontSize: 11 },
});

const estilosPorEscala = new WeakMap<EscalaMaster, ReturnType<typeof crearEstilos>>();
function useEstilosS() {
  const esc = useEscala();
  let valor = estilosPorEscala.get(esc);
  if (!valor) { valor = crearEstilos(esc); estilosPorEscala.set(esc, valor); }
  return valor;
}
