import type { PanelHabitos } from '../habitos/tipos';

// Selector de plantillas puro (sin red, sin latencia) — el agente Aby real
// (src/modulos/aby/) está pensado para armar rutas de estudio, no reflexiones
// diarias; llamarlo acá agregaría una espera de IA a cada carga de Insights,
// justo lo contrario de lo que se pidió. En vez de eso, se elige el mensaje
// más honesto según los datos reales que ya trajo el panel — cero consultas
// nuevas.
export function elegirReflexionAby(panel: PanelHabitos): string {
  const riesgoAlto = panel.riesgo.datos.find((item) => item.nivel === 'alto');
  if (riesgoAlto) {
    return `Noté que "${riesgoAlto.titulo}" bajó el ritmo últimamente. No pasa nada — retomarlo hoy ya cuenta.`;
  }

  const sinHistorialSuficiente = panel.patrones.estado === 'sin_habitos' || panel.patrones.estado === 'sin_historial' || panel.patrones.estado === 'en_observacion';
  if (sinHistorialSuficiente) {
    return 'Todavía estoy conociendo tus patrones — seguí registrando tus días y pronto voy a poder contarte más.';
  }

  const diasConMuestras = panel.patrones.datos.filter((item) => item.muestras > 0);
  const constanciaPromedio = diasConMuestras.length > 0
    ? diasConMuestras.reduce((suma, item) => suma + item.porcentaje, 0) / diasConMuestras.length
    : 0;

  if (constanciaPromedio >= 70) {
    return 'Tu constancia viene fuerte estas semanas. Esto es lo que se siente construir algo de verdad.';
  }

  if (panel.riesgo.datos.length > 0) {
    return 'Vas sosteniendo tus hábitos — hay alguno que pide un poco más de atención esta semana.';
  }

  return 'Cada día que registrás suma, aunque hoy no se sienta como un gran cambio.';
}
