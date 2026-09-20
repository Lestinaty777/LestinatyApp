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
  paqueteId?: string;
  /** master_pack_color del paquete del hábito (arboles_paquetes). */
  colorPaquete?: string;
};

/** Solo lo devuelven patrones/riesgo/conexiones — cuánto hay acumulado vs. cuánto hace falta para que `estado` llegue a 'listo'. Ver comercio.obtener_panel_habitos. */
export type ProgresoSeccionPanel = { actual: number; requerido: number };

export type SeccionPanelHabitos<T> = {
  estado: EstadoPanelHabitos;
  datos: T;
  progreso?: ProgresoSeccionPanel;
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

export type DetalleHabito = {
  habito: HabitoResumen;
  nivel: number;
  semana: { completados: number; programados: number; porcentaje: number };
  rachaActual: number;
  totalAcumulado: number;
  mejorDia: string | null;
  progresoSemana: { fecha: string; etiqueta: string; progreso: number; valor: number; meta: number }[];
};

export type PlanHabitoResumen = {
  color: string;
  horaRecordatorio: string | null;
  id: string;
  iconoLucide: string;
  nivel: number;
  recordatorioActivo: boolean;
  titulo: string;
};

export type ProximoNivelHabito = {
  color: string;
  diasCompletados: number;
  diasRequeridos: number;
  iconoLucide: string;
  id: string;
  nivel: number;
  porcentaje: number;
  titulo: string;
};

export type MejorRachaHabito = {
  color: string;
  historial28: boolean[];
  iconoLucide: string;
  id: string;
  racha: number;
  titulo: string;
};

export type ResultadoRegistroHabito = {
  fechaLocal: string;
  gemasGanadas: number;
  habitoId: string;
  id: string;
  nivel: number;
  nota: string | null;
  subioNivel: boolean;
  valor: number;
};
