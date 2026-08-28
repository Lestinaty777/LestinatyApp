export interface ActividadDiaria {
  fecha: string; // YYYY-MM-DD
  completadas: number;
  total: number;
}

export interface RutinasEstadisticas {
  tasaConsistencia: number; // 0-100
  rachaActual: number;
  mejorRacha: number;
  distribucionHoraria: {
    manana: number;
    tarde: number;
    noche: number;
  };
  actividadReciente: ActividadDiaria[]; // Ultimos 28 dias
}
