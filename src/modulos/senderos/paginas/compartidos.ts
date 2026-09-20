import { PaginaSenderos } from './tipos';
import { ESCALA_ESMERALDA } from '../../../diseno/tema/escalaEsmeralda';

export const paginaSenderosCompartidos: PaginaSenderos = {
  subtitulo: 'Invita personas y conserva en un solo lugar los caminos que estan construyendo juntos.',
  titulo: 'Senderos compartidos',
};

export type TipoAlianza = 'duo' | 'escuadra';

export type CategoriaSenderoCompartidoId =
  | 'rutinas'
  | 'salud'
  | 'habitos'
  | 'tareas'
  | 'finanzas'
  | 'relaciones'
  | 'estudio';

export type MiembroSendero = {
  avatarUrl?: string;
  colorAvatar: string;
  completadoHoy: boolean;
  esUsuarioActual: boolean;
  horaCompletado?: string;
  id: string;
  iniciales: string;
  nombre: string;
  ramaElegida?: string;
};

export type SenderoCompartido = {
  acento: string;
  categoria: string;
  categoriaId: CategoriaSenderoCompartidoId;
  descripcion: string;
  estadoSincronia: 'perfecta' | 'en-progreso' | 'en-riesgo';
  etapaActual: string;
  etiquetaEstandarte: string;
  frecuencia: string;
  id: string;
  mensajeMotivacional?: string;
  miembros: MiembroSendero[];
  nodoActualNumero: number;
  progresoPorcentaje: number;
  proximaAccion: string;
  rachaDias: number;
  tipo: TipoAlianza;
  titulo: string;
  totalNodos: number;
};

export const senderosCompartidosMock: SenderoCompartido[] = [
  {
    acento: ESCALA_ESMERALDA.hoja.l77b,
    categoria: 'Salud',
    categoriaId: 'salud',
    descripcion: 'Paseo activo y desconexión diaria para oxigenar cuerpo y mente.',
    estadoSincronia: 'en-progreso',
    etapaActual: 'Campamento 2 · Ruta de Bienestar',
    etiquetaEstandarte: 'Salud',
    frecuencia: 'Diario',
    id: 'caminar-duo',
    mensajeMotivacional: 'Esperando a Sofía para sellar la racha de hoy 🌱',
    miembros: [
      {
        colorAvatar: ESCALA_ESMERALDA.hoja.l77b,
        completadoHoy: true,
        esUsuarioActual: true,
        horaCompletado: '08:30 AM',
        id: 'user-1',
        iniciales: 'YO',
        nombre: 'Tú',
        ramaElegida: 'Rama Ligera',
      },
      {
        colorAvatar: '#FF8A00',
        completadoHoy: false,
        esUsuarioActual: false,
        id: 'user-2',
        iniciales: 'SO',
        nombre: 'Sofía',
        ramaElegida: 'Rama Ligera',
      },
    ],
    nodoActualNumero: 5,
    progresoPorcentaje: 65,
    proximaAccion: 'Completar paseo de 20 min',
    rachaDias: 14,
    tipo: 'duo',
    titulo: 'Caminar 20 min',
    totalNodos: 8,
  },
  {
    acento: '#8E3DFF',
    categoria: 'Estudio',
    categoriaId: 'estudio',
    descripcion: 'Práctica intensiva de inglés con bloques pomodoro y vocabulario.',
    estadoSincronia: 'en-progreso',
    etapaActual: 'Bifurcación 2 · Rama Ágil vs Profunda',
    etiquetaEstandarte: 'Inglés',
    frecuencia: 'Lun a Vie',
    id: 'ingles-escuadra',
    mensajeMotivacional: '¡3 de 4 listos! Solo falta Lucas para la racha del equipo 🔥',
    miembros: [
      {
        colorAvatar: '#8E3DFF',
        completadoHoy: true,
        esUsuarioActual: true,
        horaCompletado: '09:15 AM',
        id: 'user-1',
        iniciales: 'YO',
        nombre: 'Tú',
        ramaElegida: 'Rama Ágil',
      },
      {
        colorAvatar: '#1463FF',
        completadoHoy: true,
        esUsuarioActual: false,
        horaCompletado: '10:00 AM',
        id: 'user-3',
        iniciales: 'MA',
        nombre: 'Mateo',
        ramaElegida: 'Rama Ágil',
      },
      {
        colorAvatar: '#FF2D93',
        completadoHoy: true,
        esUsuarioActual: false,
        horaCompletado: '10:45 AM',
        id: 'user-4',
        iniciales: 'VA',
        nombre: 'Valentina',
        ramaElegida: 'Rama Profunda',
      },
      {
        colorAvatar: '#FFC400',
        completadoHoy: false,
        esUsuarioActual: false,
        id: 'user-5',
        iniciales: 'LU',
        nombre: 'Lucas',
        ramaElegida: 'Rama Creativa',
      },
    ],
    nodoActualNumero: 4,
    progresoPorcentaje: 50,
    proximaAccion: 'Terminar módulo de vocabulario',
    rachaDias: 9,
    tipo: 'escuadra',
    titulo: 'Inglés Pomodoro',
    totalNodos: 8,
  },
  {
    acento: '#FF3B30',
    categoria: 'Habitos',
    categoriaId: 'habitos',
    descripcion: 'Lectura reflexiva sin pantallas para cerrar el día en calma.',
    estadoSincronia: 'perfecta',
    etapaActual: 'Campamento 3 · Hito de 21 Días',
    etiquetaEstandarte: 'Lectura',
    frecuencia: 'Diario',
    id: 'lectura-duo',
    mensajeMotivacional: '✨ ¡Ambos completaron su lectura hoy! Sincronía al 100%',
    miembros: [
      {
        colorAvatar: '#FF3B30',
        completadoHoy: true,
        esUsuarioActual: true,
        horaCompletado: '07:15 AM',
        id: 'user-1',
        iniciales: 'YO',
        nombre: 'Tú',
        ramaElegida: 'Rama Clásica',
      },
      {
        colorAvatar: '#FF8A00',
        completadoHoy: true,
        esUsuarioActual: false,
        horaCompletado: '08:40 AM',
        id: 'user-6',
        iniciales: 'CA',
        nombre: 'Carlos',
        ramaElegida: 'Rama Clásica',
      },
    ],
    nodoActualNumero: 7,
    progresoPorcentaje: 88,
    proximaAccion: 'Leer 15 páginas',
    rachaDias: 21,
    tipo: 'duo',
    titulo: 'Lectura 15 min',
    totalNodos: 8,
  },
  {
    acento: '#1463FF',
    categoria: 'Rutinas',
    categoriaId: 'rutinas',
    descripcion: 'Check-in y arranque de foco a primera hora de la mañana.',
    estadoSincronia: 'en-progreso',
    etapaActual: 'Bifurcación 1 · Arranque Temprano',
    etiquetaEstandarte: 'Club 6:30',
    frecuencia: 'Lun/Mie/Vie',
    id: 'manana-escuadra',
    mensajeMotivacional: '4 de 5 miembros completaron su rutina matutina',
    miembros: [
      {
        colorAvatar: '#1463FF',
        completadoHoy: true,
        esUsuarioActual: true,
        horaCompletado: '06:45 AM',
        id: 'user-1',
        iniciales: 'YO',
        nombre: 'Tú',
        ramaElegida: 'Rama Enfoque',
      },
      {
        colorAvatar: ESCALA_ESMERALDA.hoja.l77b,
        completadoHoy: true,
        esUsuarioActual: false,
        horaCompletado: '07:00 AM',
        id: 'user-7',
        iniciales: 'DA',
        nombre: 'Daniel',
        ramaElegida: 'Rama Enfoque',
      },
      {
        colorAvatar: '#8E3DFF',
        completadoHoy: true,
        esUsuarioActual: false,
        horaCompletado: '07:10 AM',
        id: 'user-8',
        iniciales: 'EL',
        nombre: 'Elena',
        ramaElegida: 'Rama Movimiento',
      },
      {
        colorAvatar: '#FF2D93',
        completadoHoy: true,
        esUsuarioActual: false,
        horaCompletado: '07:30 AM',
        id: 'user-9',
        iniciales: 'PA',
        nombre: 'Paula',
        ramaElegida: 'Rama Enfoque',
      },
      {
        colorAvatar: '#FF8A00',
        completadoHoy: false,
        esUsuarioActual: false,
        id: 'user-10',
        iniciales: 'NI',
        nombre: 'Nicolás',
        ramaElegida: 'Rama Meditación',
      },
    ],
    nodoActualNumero: 3,
    progresoPorcentaje: 38,
    proximaAccion: 'Hacer check-in matutino',
    rachaDias: 6,
    tipo: 'escuadra',
    titulo: 'Club de las 6:30 AM',
    totalNodos: 8,
  },
  {
    acento: '#FF9500',
    categoria: 'Finanzas',
    categoriaId: 'finanzas',
    descripcion: 'Ahorro semanal para viaje en grupo.',
    estadoSincronia: 'en-progreso',
    etapaActual: 'Meta 1 · Fondo inicial',
    etiquetaEstandarte: 'Ahorro',
    frecuencia: 'Semanal',
    id: 'ahorro-escuadra',
    mensajeMotivacional: '¡Falta poco para la primera meta!',
    miembros: [
      { colorAvatar: '#FF9500', completadoHoy: true, esUsuarioActual: true, id: 'user-1', iniciales: 'YO', nombre: 'Tú', ramaElegida: 'Agresiva' },
      { colorAvatar: '#FF3B30', completadoHoy: false, esUsuarioActual: false, id: 'user-11', iniciales: 'AN', nombre: 'Ana', ramaElegida: 'Conservadora' },
    ],
    nodoActualNumero: 2,
    progresoPorcentaje: 25,
    proximaAccion: 'Transferir $500 al fondo',
    rachaDias: 2,
    tipo: 'duo',
    titulo: 'Fondo Viaje',
    totalNodos: 8,
  },
  {
    acento: '#FF2D55',
    categoria: 'Relaciones',
    categoriaId: 'relaciones',
    descripcion: 'Llamada familiar semanal.',
    estadoSincronia: 'perfecta',
    etapaActual: 'Mantenimiento',
    etiquetaEstandarte: 'Familia',
    frecuencia: 'Semanal',
    id: 'llamada-duo',
    mensajeMotivacional: 'Ambos llamaron esta semana ✨',
    miembros: [
      { colorAvatar: '#FF2D55', completadoHoy: true, esUsuarioActual: true, id: 'user-1', iniciales: 'YO', nombre: 'Tú', ramaElegida: 'Constante' },
      { colorAvatar: '#5AC8FA', completadoHoy: true, esUsuarioActual: false, id: 'user-12', iniciales: 'MA', nombre: 'Mamá', ramaElegida: 'Constante' },
    ],
    nodoActualNumero: 8,
    progresoPorcentaje: 100,
    proximaAccion: 'Programar llamada de 30 min',
    rachaDias: 5,
    tipo: 'duo',
    titulo: 'Llamada a casa',
    totalNodos: 8,
  },
  {
    acento: '#5AC8FA',
    categoria: 'Tareas',
    categoriaId: 'tareas',
    descripcion: 'Limpieza profunda del departamento.',
    estadoSincronia: 'en-riesgo',
    etapaActual: 'Fin de mes',
    etiquetaEstandarte: 'Limpieza',
    frecuencia: 'Mensual',
    id: 'limpieza-escuadra',
    mensajeMotivacional: 'Estamos atrasados este mes 🚨',
    miembros: [
      { colorAvatar: '#5AC8FA', completadoHoy: false, esUsuarioActual: true, id: 'user-1', iniciales: 'YO', nombre: 'Tú', ramaElegida: 'Rápida' },
      { colorAvatar: ESCALA_ESMERALDA.hoja.l77a, completadoHoy: false, esUsuarioActual: false, id: 'user-13', iniciales: 'RO', nombre: 'Roomie', ramaElegida: 'Detallada' },
    ],
    nodoActualNumero: 1,
    progresoPorcentaje: 12,
    proximaAccion: 'Barrer y trapear área común',
    rachaDias: 0,
    tipo: 'duo',
    titulo: 'Depa Impecable',
    totalNodos: 8,
  }
];
