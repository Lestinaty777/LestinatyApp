export const INTENCIONES_ESTUDIO_ABY = [
  'examen',
  'materia',
  'habito-estudio',
  'rutina-estudio',
] as const;

export type IntencionEstudioAbyId = typeof INTENCIONES_ESTUDIO_ABY[number];

export type IntencionEstudioAby = {
  color: string;
  contexto: string;
  descripcion: string;
  id: IntencionEstudioAbyId;
  icono: 'archivo' | 'birrete' | 'calendario' | 'fuego';
  placeholder: string;
  subtitulo: string;
  titulo: string;
};

export const intencionesEstudioAby: readonly IntencionEstudioAby[] = [
  {
    color: '#377DDE',
    contexto: 'Fecha, temas y material. Aby crea tu plan de repaso.',
    descripcion: 'Prepárate con un plan hasta tu fecha.',
    icono: 'archivo',
    id: 'examen',
    placeholder: 'Ej. Parcial de anatomía el 18 de octubre',
    subtitulo: 'TENGO UN EXAMEN',
    titulo: 'Tengo un examen',
  },
  {
    color: ESCALA_ESMERALDA.jade.l59,
    contexto: 'Define el tema y tu nivel. Aby ordena lo que necesitas dominar.',
    descripcion: 'Construye bases tema por tema.',
    icono: 'birrete',
    id: 'materia',
    placeholder: 'Ej. Quiero dominar cálculo diferencial',
    subtitulo: 'DOMINAR UNA MATERIA',
    titulo: 'Dominar una materia',
  },
  {
    color: '#D5A119',
    contexto: 'Elige un ritmo sostenible. Aby te ayuda a mantenerlo.',
    descripcion: 'Estudia con constancia cada semana.',
    icono: 'fuego',
    id: 'habito-estudio',
    placeholder: 'Ej. Quiero estudiar inglés sin dejarlo',
    subtitulo: 'HÁBITO DE ESTUDIO',
    titulo: 'Hábito de estudio',
  },
  {
    color: '#D85B54',
    contexto: 'Organiza sesiones y descansos que sí caben en tu semana.',
    descripcion: 'Ordena sesiones, prioridades y descansos.',
    icono: 'calendario',
    id: 'rutina-estudio',
    placeholder: 'Ej. Organiza mi semana de estudio',
    subtitulo: 'ORGANIZAR MI RUTINA',
    titulo: 'Organizar mi rutina',
  },
];

export function colorIntencionEstudioAby(intencion: IntencionEstudioAbyId | null) {
  return intencionesEstudioAby.find((item) => item.id === intencion)?.color ?? '#377DDE';
}

const categoriasVisuales: Record<IntencionEstudioAbyId, CategoriaAbyId> = {
  examen: 'rutinas',
  'habito-estudio': 'tareas',
  materia: 'salud',
  'rutina-estudio': 'habitos',
};

export function categoriaVisualIntencionEstudioAby(intencion: IntencionEstudioAbyId): CategoriaAbyId {
  return categoriasVisuales[intencion];
}

export function subtituloIntencionEstudioAby(intencion: IntencionEstudioAbyId | null) {
  return intencionesEstudioAby.find((item) => item.id === intencion)?.subtitulo ?? 'Cuéntale a Lestinaty qué necesitas estudiar.';
}
import type { CategoriaAbyId } from './categoriasAby';
import { ESCALA_ESMERALDA } from '../../../diseno/tema/escalaEsmeralda';
