export const INTENCIONES_ESTUDIO_ABY = [
  'examen',
  'materia',
  'habito-estudio',
  'rutina-estudio',
] as const;

export type IntencionEstudioAbyId = typeof INTENCIONES_ESTUDIO_ABY[number];

export type IntencionEstudioAby = {
  color: string;
  descripcion: string;
  id: IntencionEstudioAbyId;
  icono: 'archivo' | 'birrete' | 'calendario' | 'fuego';
  placeholder: string;
  titulo: string;
};

export const intencionesEstudioAby: readonly IntencionEstudioAby[] = [
  {
    color: '#377DDE',
    descripcion: 'Prepárate con un plan hasta tu fecha.',
    icono: 'archivo',
    id: 'examen',
    placeholder: 'Ej. Parcial de anatomía el 18 de octubre',
    titulo: 'Tengo un examen',
  },
  {
    color: '#3A9B68',
    descripcion: 'Construye bases tema por tema.',
    icono: 'birrete',
    id: 'materia',
    placeholder: 'Ej. Quiero dominar cálculo diferencial',
    titulo: 'Dominar una materia',
  },
  {
    color: '#D5A119',
    descripcion: 'Estudia con constancia cada semana.',
    icono: 'fuego',
    id: 'habito-estudio',
    placeholder: 'Ej. Quiero estudiar inglés sin dejarlo',
    titulo: 'Hábito de estudio',
  },
  {
    color: '#D85B54',
    descripcion: 'Ordena sesiones, prioridades y descansos.',
    icono: 'calendario',
    id: 'rutina-estudio',
    placeholder: 'Ej. Organiza mi semana de estudio',
    titulo: 'Organizar mi rutina',
  },
];

export function colorIntencionEstudioAby(intencion: IntencionEstudioAbyId | null) {
  return intencionesEstudioAby.find((item) => item.id === intencion)?.color ?? '#377DDE';
}
