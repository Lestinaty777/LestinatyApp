import type { FranjaDia } from '../../compartido/utilidades/franjas';

export type EstadoTarea = 'pendiente' | 'hecha' | 'archivada';

export type PrioridadTarea =
  | 'urgente_importante'
  | 'urgente_no_importante'
  | 'no_urgente_importante'
  | 'no_urgente_no_importante';

/**
 * Los únicos 4 tipos con mecánica de completar propia. Kanban y Eisenhower
 * NO son un tipo — son vistas de organización sobre cualquiera de estos 4
 * (columnaKanban/prioridad son campos independientes de `tipo`, ver abajo).
 */
export type TipoTarea = 'simple' | 'checklist' | 'contador' | 'cronometro';

export type FrecuenciaTarea = 'una_vez' | 'dias_semana';

export type Tarea = {
  id: string;
  titulo: string;
  descripcion: string | null;
  estado: EstadoTarea;
  tipo: TipoTarea;
  prioridad: PrioridadTarea | null;
  franja: FranjaDia;
  /** Columna del tablero Kanban — vista sobre "Mis tareas", no un tipo de tarea (ver plan). */
  columnaKanban: string | null;
  fechaVencimiento: string | null;
  frecuencia: FrecuenciaTarea;
  /** Solo cuando frecuencia = 'dias_semana' — isodow (1=lunes..7=domingo). */
  diasSemana: number[] | null;
  recordatorioActivo: boolean;
  horaRecordatorio: string | null;
  mostrarNombreNotificacion: boolean;
  /** Paquete de la semilla usada para "vestir" la tarea — null si no tiene ninguna asignada. */
  paqueteId: string | null;
  color: string | null;
  iconoLucide: string | null;
  orden: number;
  creadaEn: string;
  completadaEn: string | null;
  /**
   * Sendero de días (Fase 8) — solo tiene sentido para tipo en
   * ('simple','contador','cronometro') con frecuencia='dias_semana'; en el
   * resto de los casos quedan en su valor por default (nivel 1, sin uso).
   */
  nivel: number;
  nivelDesdeFecha: string;
  objetivoValor: number;
  unidad: string | null;
};

export type CrearTareaInput = {
  titulo: string;
  descripcion?: string | null;
  tipo?: TipoTarea;
  /** Solo cuando tipo = 'checklist' — títulos de los pasos, en orden. Se insertan en tareas_subitems tras crear la tarea. */
  pasos?: string[];
  prioridad?: PrioridadTarea | null;
  columnaKanban?: string | null;
  fechaVencimiento?: string | null;
  frecuencia?: FrecuenciaTarea;
  diasSemana?: number[] | null;
  recordatorioActivo?: boolean;
  horaRecordatorio?: string | null;
  mostrarNombreNotificacion?: boolean;
  paqueteId?: string | null;
  color?: string | null;
  iconoLucide?: string | null;
  franja?: FranjaDia;
};

export type EditarTareaInput = Partial<CrearTareaInput>;

// ─── Checklist (tareas_subitems) ───────────────────────────────────────────
export type SubitemTarea = {
  id: string;
  tareaId: string;
  titulo: string;
  hecho: boolean;
  orden: number;
};

// ─── Hoy ────────────────────────────────────────────────────────────────────
export type TareaHoyDetalle = {
  id: string;
  titulo: string;
  descripcion: string | null;
  iconoLucide: string | null;
  color: string | null;
  tipo: TipoTarea;
  frecuencia: FrecuenciaTarea;
  franja: FranjaDia;
  prioridad: PrioridadTarea | null;
  columnaKanban: string | null;
  completada: boolean;
  racha: number;
  /** Meta numérica (contador/cronómetro con sendero de días) — 1 para el resto. */
  objetivoValor: number;
  unidad: string | null;
  /**
   * Progreso actual hacia objetivoValor. Para 'dias_semana' es el valor de
   * hoy en tareas_registros; para 'una_vez' es tareas_items.valor_actual
   * (no hay "por día" para algo que pasa una sola vez) — 0 si no hay avance.
   */
  valorHoy: number;
};

// ─── Progreso de una tarea 'una_vez' tipo contador/cronómetro ─────────────
// Sin niveles, sin figuras, sin gemas — ver registrar_progreso_tarea_unica.
export type ResultadoProgresoTareaUnica = {
  id: string;
  valorActual: number;
  objetivoValor: number;
  completada: boolean;
};

// ─── Completar/descompletar un día ────────────────────────────────────────
export type ResultadoCompletarTarea = {
  id: string;
  completada: boolean;
  /** null para tareas 'una_vez' (no llevan racha). */
  racha: number | null;
  gemasGanadas: number;
};

// ─── Panel de insights (obtener_panel_tareas) ─────────────────────────────
export type EstadoPanelTareas = 'sin_tareas' | 'sin_historial' | 'en_observacion' | 'listo';
export type ProgresoSeccionPanelTareas = { actual: number; requerido: number };
export type SeccionPanelTareas<T> = { estado: EstadoPanelTareas; datos: T; progreso: ProgresoSeccionPanelTareas };
export type PatronTarea = { diaSemana: number; completados: number; muestras: number; porcentaje: number };
export type RiesgoTarea = { tareaId: string; titulo: string; iconoLucide: string | null; color: string | null; reciente: number; base: number; nivel: 'alto' | 'medio' | 'bajo' };
export type PanelTareas = {
  patrones: SeccionPanelTareas<PatronTarea[]>;
  riesgo: SeccionPanelTareas<RiesgoTarea[]>;
};

// ─── Mejor racha (para una tarjeta tipo RachaCard) ─────────────────────────
export type MejorRachaTarea = {
  id: string;
  titulo: string;
  iconoLucide: string | null;
  color: string | null;
  racha: number;
};

// ─── Recordatorios (lista, mismo espíritu que PlanHabitoResumen) ───────────
export type PlanTareaResumen = {
  id: string;
  titulo: string;
  iconoLucide: string | null;
  color: string | null;
  recordatorioActivo: boolean;
  horaRecordatorio: string | null;
};

// ─── Sendero de días (Fase 8) — espejo de mandalaNodo.tipos.ts, para tareas
// tipo simple/contador/cronometro con frecuencia='dias_semana'. El trazo es
// el mismo punto {x,y} genérico, pero NO es una mandala (simetría radial):
// es un único contorno con simetría de espejo horizontal, aristas rectas —
// ver figuraSello.ts.
export type EstadoFiguraTarea = 'pendiente' | 'creada';

export type TrazoFigura = { x: number; y: number };

export type FiguraTareaPendiente = {
  registroId: string;
  estado: EstadoFiguraTarea;
  semilla: string;
  paqueteId: string | null;
  color: string | null;
  nivel: number;
  ciclo: number;
  nodoDia: number;
};

export type FiguraTareaNodo = {
  registroId: string;
  nivel: number;
  ciclo: number;
  nodoDia: number;
  estado: EstadoFiguraTarea;
  semilla: string;
  trazos: TrazoFigura[] | null;
  paqueteId: string | null;
  color: string | null;
};

export type ResultadoGuardarFiguraTarea = {
  registroId: string;
  estado: EstadoFiguraTarea;
  paqueteId: string | null;
  color: string | null;
  nivel: number;
  ciclo: number;
  nodoDia: number;
};

// `TransicionSendero` (subida de nivel / ciclo de maestría) es genérica —
// mismo shape que ya usa Hábitos (senderoHabito.tipos.ts), reusada tal cual.
export type { TransicionSendero } from '../habitos/senderoHabito.tipos';

export type ResultadoRegistroTarea = {
  id: string;
  tareaId: string;
  fechaLocal: string;
  valor: number;
  nota: string | null;
  subioNivel: boolean;
  nivel: number;
  gemasGanadas: number;
  transicionSendero: import('../habitos/senderoHabito.tipos').TransicionSendero | null;
  figuraPendiente: FiguraTareaPendiente | null;
};
