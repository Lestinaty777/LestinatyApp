export type EstadoTarea = 'pendiente' | 'hecha' | 'archivada';

export type PrioridadTarea =
  | 'urgente_importante'
  | 'urgente_no_importante'
  | 'no_urgente_importante'
  | 'no_urgente_no_importante';

export type Tarea = {
  id: string;
  titulo: string;
  descripcion: string | null;
  estado: EstadoTarea;
  prioridad: PrioridadTarea | null;
  fechaVencimiento: string | null;
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
  prioridad?: PrioridadTarea | null;
  fechaVencimiento?: string | null;
  paqueteId?: string | null;
  color?: string | null;
  iconoLucide?: string | null;
};

export type EditarTareaInput = Partial<CrearTareaInput>;
