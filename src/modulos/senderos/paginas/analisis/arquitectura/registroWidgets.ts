import { WidgetEngineId } from './tipos_sdui';

// Aquí importaremos los motores genéricos conforme los vayamos adaptando
// import { MotorCilindro } from '../motores/MotorCilindro';

export const WIDGET_REGISTRY: Record<WidgetEngineId, any> = {
  'progress-cylinder': null, // Próximamente: MotorCilindro
  'trend-line': null,
  'consistency-grid': null,
  'progress-ring': null,
  'traffic-light': null,
  'radar-clock': null,
  'bar-chart': null,
  'segmented-donut': null,
  'spider-web': null,
  'speedometer': null
};
