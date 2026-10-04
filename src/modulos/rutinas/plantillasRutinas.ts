import type { FranjaDia } from '../../compartido/utilidades/franjas';
import type { ModoPasoPropio } from './rutinas.tipos';

export type PlantillaPasoRutina = {
  titulo: string;
  modo: ModoPasoPropio;
  /** Minutos (cronómetro) o cantidad (contador). */
  objetivoValor?: number;
  unidad?: string;
};

export type PlantillaRutina = {
  id: string;
  titulo: string;
  descripcion: string;
  franja: FranjaDia;
  /** Id del registro de íconos (src/diseno/iconos/registroIconos.ts). */
  iconoId: string;
  pasos: PlantillaPasoRutina[];
};

// Punto de partida para no empezar de cero: al elegir una se abre el asistente
// con todo ya cargado y se puede cambiar. Texto en español, sin capa de i18n
// por plantilla (mismo criterio que plantillasTareas.ts).
export const PLANTILLAS_RUTINAS: PlantillaRutina[] = [
  {
    id: 'manana', titulo: 'Mañana con energía', descripcion: 'Arrancar el día sin prisa', franja: 'manana', iconoId: 'sol',
    pasos: [
      { titulo: 'Tomar un vaso de agua', modo: 'simple' },
      { titulo: 'Estirar el cuerpo', modo: 'cronometro', objetivoValor: 5, unidad: 'min' },
      { titulo: 'Planear mi día', modo: 'cronometro', objetivoValor: 5, unidad: 'min' },
    ],
  },
  {
    id: 'estudio', titulo: 'Sesión de estudio', descripcion: '45 minutos con foco', franja: 'tarde', iconoId: 'estudiar',
    pasos: [
      { titulo: 'Repasar apuntes', modo: 'cronometro', objetivoValor: 10, unidad: 'min' },
      { titulo: 'Resolver ejercicios', modo: 'contador', objetivoValor: 20, unidad: 'ejercicios' },
      { titulo: 'Repasar errores', modo: 'cronometro', objetivoValor: 10, unidad: 'min' },
      { titulo: 'Descanso', modo: 'cronometro', objetivoValor: 5, unidad: 'min' },
    ],
  },
  {
    id: 'noche', titulo: 'Cierre del día', descripcion: 'Bajar el ritmo y dejar todo listo', franja: 'noche', iconoId: 'cama',
    pasos: [
      { titulo: 'Preparar lo de mañana', modo: 'simple' },
      { titulo: 'Leer un rato', modo: 'cronometro', objetivoValor: 15, unidad: 'min' },
      { titulo: 'Apagar pantallas', modo: 'simple' },
    ],
  },
  {
    id: 'ejercicio', titulo: 'Rutina de ejercicio', descripcion: 'Calentar, entrenar y estirar', franja: 'cualquier_momento', iconoId: 'hacer-ejercicio',
    pasos: [
      { titulo: 'Calentar', modo: 'cronometro', objetivoValor: 5, unidad: 'min' },
      { titulo: 'Entrenar', modo: 'cronometro', objetivoValor: 25, unidad: 'min' },
      { titulo: 'Estirar', modo: 'cronometro', objetivoValor: 5, unidad: 'min' },
    ],
  },
];
