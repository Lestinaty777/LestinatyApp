import { z } from 'zod';

export const IDS_WIDGET_LECCION = [
  'teoria-corta',
  'opcion-multiple',
  'pares-conectables',
  'rellenar-huecos',
  'verdadero-falso',
  'ordenar-lista',
  'flashcard',
  'parejas-memoria',
  'opcion-imagen',
  'desafio-final',
] as const;

export type WidgetLeccionId = typeof IDS_WIDGET_LECCION[number];

// Configuración específica de cada widget (Tipos base)
export type ConfigTeoriaCorta = {
  texto: string;
  personaje: 'explicando' | 'celebrando' | 'pensando' | 'neutro';
};

export type ConfigOpcionMultiple = {
  pregunta: string;
  opciones: string[];
  indiceCorrecto: number;
  mensajeExito?: string;
  mensajeError?: string;
};

export type ConfigParesConectables = {
  instruccion: string;
  pares: Array<{ izquierdo: string; derecho: string }>;
};

export type ConfigRellenarHuecos = {
  textoConHuecos: string; // Ejemplo: "El resultado de 2+2 es [HUECO_0]"
  opciones: string[];     // Respuestas posibles (incluye trampas)
  respuestas: string[];   // Respuestas correctas en orden de huecos
};

export type ConfigVerdaderoFalso = {
  afirmacion: string;
  esVerdadero: boolean;
  explicacion: string;
};

export type ConfigOrdenarLista = {
  instruccion: string;
  elementosDesordenados: string[];
  elementosOrdenados: string[]; // El orden correcto
};

export type ConfigFlashcard = {
  frente: string;
  dorso: string;
};

export type ConfigParejasMemoria = {
  pares: Array<{ id: string; textoA: string; textoB: string }>; // Ej: { id: "1", textoA: "Au", textoB: "Oro" }
};

export type ConfigOpcionImagen = {
  pregunta: string;
  opciones: Array<{ url: string; descripcion: string }>;
  indiceCorrecto: number;
};

export type ConfigDesafioFinal = {
  preguntas: ConfigOpcionMultiple[];
  tiempoLimiteSegundos: number;
};

// El "Paso" genérico dentro de una lección
export type PasoLeccion<T = any> = {
  id: string;
  tipo: WidgetLeccionId;
  config: T;
};

// El paquete final que devuelve la IA
export type LeccionPack = {
  id: string;
  titulo: string;
  pasos: PasoLeccion[];
};

