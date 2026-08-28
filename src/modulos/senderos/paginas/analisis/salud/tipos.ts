export interface MetricasCorporales {
  pesoDelta: number;
  grasaDelta: number;
  masaMuscularDelta: number;
  ritmoCardiacoDelta: number;
}

export interface PuntoSuenoHumor {
  horasSueno: number; // 4 to 10
  humor: number; // 1 to 10
}

export interface MacrosDiarios {
  proteina: number;
  carbos: number;
  grasas: number;
}

export interface SaludEstadisticas {
  correlacionSuenoHumor: PuntoSuenoHumor[];
  actividadMensual: number[]; // 28 days of activity score
  macros: MacrosDiarios;
  metricasCorporales: MetricasCorporales;
  diasEntrenamientoIntenso: number;
  diasDescansoActivo: number;
}
