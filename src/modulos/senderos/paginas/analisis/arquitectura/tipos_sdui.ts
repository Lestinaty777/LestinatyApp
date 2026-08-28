// Identificadores fijos de nuestros Motores Visuales (Capa 1)
export type WidgetEngineId = 
  | 'progress-cylinder'
  | 'trend-line'
  | 'consistency-grid'
  | 'progress-ring'
  | 'traffic-light'
  | 'radar-clock'
  | 'bar-chart'
  | 'segmented-donut'
  | 'spider-web'
  | 'speedometer';

// El Content Pack generado/cacheado (Capa 2)
export interface ContentPack {
  id: string;
  goal_id: string;
  habit_id: string;
  widget_id: WidgetEngineId;
  
  // Customización visual
  title: string;
  subtitle: string;
  value_label: string;
  unit: string;
  icon: string;
  color_override: string | null;
  
  // Textos dinámicos / Microcopy
  microcopy: {
    onTrack: string;
    behind: string;
    done: string;
  };
}

// Datos crudos del usuario
export interface UserMetric {
  habit_id: string;
  date: string;
  value: number;
}
