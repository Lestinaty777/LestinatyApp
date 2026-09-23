export type CodigoTareaDiaria = 'sendero_1_nodo' | 'sendero_2_nodos' | 'sendero_dia_completo';

export type EstadoTareaDiaria = 'bloqueada' | 'disponible' | 'reclamada';

export type TareaDiaria = {
  codigo: CodigoTareaDiaria;
  gemas: number;
  progreso: number;
  meta: number;
  estado: EstadoTareaDiaria;
};

export type ResumenTareasDiarias = {
  fechaLocal: string;
  nodosProgramados: number;
  tareas: TareaDiaria[];
};

export type ResultadoReclamoTarea = {
  exito: boolean;
  tareaCodigo: CodigoTareaDiaria;
  gemas: number;
  saldo: number;
  yaReclamado: boolean;
};
