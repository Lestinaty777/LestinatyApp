import type { ComponentType } from 'react';
import type { ZodType } from 'zod';

export const IDS_WIDGET_ACCION = [
  'checklist-asistida',
  'cronometro',
  'registro',
  'kanban',
  'eisenhower',
  'foco',
  'decision',
  'escala',
  'contador',
  'planificador-semanal',
] as const;

export const IDS_WIDGET_PROGRESO = [
  'progress-cylinder',
  'trend-line',
  'consistency-grid',
  'progress-ring',
  'traffic-light',
  'radar-clock',
  'bar-chart',
  'segmented-donut',
  'spider-web',
  'speedometer',
] as const;

export type WidgetAccionId = typeof IDS_WIDGET_ACCION[number];
export type WidgetProgresoId = typeof IDS_WIDGET_PROGRESO[number];
export type RolWidgetAccion = 'principal' | 'apoyo';
export type EstadoWidgetAccion = 'activo' | 'bloqueado' | 'completado';

export type EventoWidgetAccion = {
  completado?: boolean;
  datos?: Record<string, unknown>;
  tipo: 'avance' | 'completado' | 'registro';
  widgetId: WidgetAccionId;
};

export type WidgetAccionProps<Config = Record<string, unknown>> = {
  color: string;
  config: Config;
  estado: EstadoWidgetAccion;
  onEvento: (evento: EventoWidgetAccion) => void;
};

export type DefinicionWidgetAccion = {
  Componente: ComponentType<WidgetAccionProps>;
  descripcion: string;
  esquemaConfig: ZodType;
};

export type WidgetAccionPack = {
  config: Record<string, unknown>;
  id: WidgetAccionId;
  rol: RolWidgetAccion;
};

export type ActionPack = {
  nodoId: string;
  version: 1;
  widgets: readonly WidgetAccionPack[];
};
