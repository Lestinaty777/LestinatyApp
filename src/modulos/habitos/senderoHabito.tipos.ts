export type EstadoSeccionSendero = 'completado' | 'actual' | 'bloqueado';

export type SeccionSenderoHabito = {
  nivel: 1 | 2 | 3 | 4 | 5 | 6 | 7;
  ciclo: number;
  estado: EstadoSeccionSendero;
  diasCompletados: number;
  diasRequeridos: number;
  puedeAvanzarHoy: boolean;
  disponibleDesde: string | null;
  totalDiasNivel7: number;
};

export type ResumenSenderoHabito = {
  nivelActual: number;
  secciones: SeccionSenderoHabito[];
};

export type TransicionSendero = {
  tipo: 'nivel' | 'ciclo_maestria';
  nivelAnterior: number;
  nivelActual: number;
  cicloAnterior: number;
  cicloActual: number;
  cofreFinalReclamado: true;
  gemas: number;
};
