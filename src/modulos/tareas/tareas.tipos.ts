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
  /** Columna del tablero Kanban — vista sobre "Mis tareas", no un tipo de tarea (ver plan). */
  columnaKanban: string | null;
  fechaVencimiento: string | null;
  frecuencia: FrecuenciaTarea;
  /** Solo cuando frecuencia = 'dias_semana' — isodow (1=lunes..7=domingo). */
  diasSemana: number[] | null;
  recordatorioActivo: boolean;
  horaRecordatorio: string | null;
  mostrarNombreNotificacion: boolean;
  /** De qué rutina es parte — el módulo de Rutinas todavía no existe, este campo solo lo deja listo. */
  routineId: string | null;
  /** Paquete de la semilla usada para "vestir" la tarea — null si no tiene ninguna asignada. */
  paqueteId: string | null;
  color: string | null;
  iconoLucide: string | null;
  orden: number;
  creadaEn: string;
  completadaEn: string | null;
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
  routineId?: string | null;
  paqueteId?: string | null;
  color?: string | null;
  iconoLucide?: string | null;
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
  prioridad: PrioridadTarea | null;
  columnaKanban: string | null;
  completada: boolean;
  racha: number;
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
