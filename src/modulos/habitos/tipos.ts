export const categoriasHabitos = ['hoy', 'patrones', 'conexiones', 'riesgo', 'impacto'] as const;

export type CategoriaHabitosId = typeof categoriasHabitos[number];
export type EstadoPanelHabitos = 'sin_habitos' | 'sin_historial' | 'en_observacion' | 'listo';
export type TipoMetaHabito = 'check' | 'cantidad' | 'duracion';

export type HabitoResumen = {
  id: string;
  titulo: string;
  descripcion: string | null;
  iconoLucide: string;
  color: string;
  tipoMeta: TipoMetaHabito;
  unidad: string | null;
  meta: number;
  valorHoy: number;
  completado: boolean;
};

export type SeccionPanelHabitos<T> = {
  estado: EstadoPanelHabitos;
  datos: T;
};

export type PatronHabito = { diaSemana: number; completados: number; muestras: number; porcentaje: number };
export type ConexionHabito = { origenHabitoId: string; destinoHabitoId: string; comparables: number; juntos: number; fuerza: number };
export type RiesgoHabito = { habitoId: string; titulo: string; iconoLucide: string; color: string; reciente: number; base: number; nivel: 'alto' | 'medio' | 'bajo' };
export type ImpactoHabito = { origenHabitoId: string; destinoHabitoId: string; conOrigen: number; sinOrigen: number; impacto: number };

export type PanelHabitos = {
  hoy: SeccionPanelHabitos<HabitoResumen[]>;
  patrones: SeccionPanelHabitos<PatronHabito[]>;
  conexiones: SeccionPanelHabitos<ConexionHabito[]>;
  riesgo: SeccionPanelHabitos<RiesgoHabito[]>;
  impacto: SeccionPanelHabitos<ImpactoHabito[]>;
};
