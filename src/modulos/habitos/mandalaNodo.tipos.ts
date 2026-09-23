export type EstadoMandala = 'pendiente' | 'creada';

// Un trazo simplificado — puntos ya reducidos, nunca un bitmap ni un SVG
// completo. Coordenadas relativas al centro del lienzo del compositor.
export type TrazoMandala = { x: number; y: number };

export type InfoMandalaPendiente = {
  registroId: string;
  estado: EstadoMandala;
  semilla: string;
  paqueteId: string | null;
  color: string | null;
  nivel: number;
  ciclo: number;
  nodoDia: number;
};

export type InfoMandalaNodo = {
  registroId: string;
  nivel: number;
  ciclo: number;
  nodoDia: number;
  estado: EstadoMandala;
  semilla: string;
  trazos: TrazoMandala[] | null;
  paqueteId: string | null;
  color: string | null;
};

export type ResultadoGuardarMandala = {
  registroId: string;
  estado: EstadoMandala;
  paqueteId: string | null;
  color: string | null;
  nivel: number;
  ciclo: number;
  nodoDia: number;
};
