import type { PanelHabitos } from '../habitos/tipos';
import { i18n } from '../../servicios/i18n/i18n';

// Selector de plantillas puro (sin red, sin latencia) — el agente Aby real
// (src/modulos/aby/) está pensado para armar rutas de estudio, no reflexiones
// diarias; llamarlo acá agregaría una espera de IA a cada carga de Insights,
// justo lo contrario de lo que se pidió. En vez de eso, se elige el mensaje
// más honesto según los datos reales que ya trajo el panel — cero consultas
// nuevas.
export function elegirReflexionAby(panel: PanelHabitos): string {
  const riesgoAlto = panel.riesgo.datos.find((item) => item.nivel === 'alto');
  if (riesgoAlto) {
    return i18n.t('insights.reflection.highRisk', { title: riesgoAlto.titulo });
  }

  const sinHistorialSuficiente = panel.patrones.estado === 'sin_habitos' || panel.patrones.estado === 'sin_historial' || panel.patrones.estado === 'en_observacion';
  if (sinHistorialSuficiente) {
    return i18n.t('insights.reflection.insufficientHistory');
  }

  const diasConMuestras = panel.patrones.datos.filter((item) => item.muestras > 0);
  const constanciaPromedio = diasConMuestras.length > 0
    ? diasConMuestras.reduce((suma, item) => suma + item.porcentaje, 0) / diasConMuestras.length
    : 0;

  if (constanciaPromedio >= 70) {
    return i18n.t('insights.reflection.strongConsistency');
  }

  if (panel.riesgo.datos.length > 0) {
    return i18n.t('insights.reflection.needsAttention');
  }

  return i18n.t('insights.reflection.dailyProgress');
}
