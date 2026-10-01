import type { LucideIcon } from 'lucide-react-native';
import { Bike, Check, Clock3, Dumbbell, HeartPulse, Repeat2, StretchHorizontal } from 'lucide-react-native';
import type { InfoMandalaNodo } from '../../habitos/mandalaNodo.tipos';
import type { FiguraTareaNodo } from '../../tareas/tareas.tipos';


// 'esperando': es el siguiente nodo, pero ya se completó el de hoy — no se
// puede avanzar hasta el próximo día programado. Distinto de 'bloqueado'
// (nodo futuro real, aún no alcanzado) aunque hoy comparten tratamiento
// visual — ver NodoSendero.tsx.
export type EstadoNodoMapa = 'activo' | 'bloqueado' | 'completado' | 'esperando';

// 'orbe_figura': espejo de 'orbe_mandala' para el sendero de días de Tareas
// (Fase 8) — mismo pedestal, con la figura de 6 pliegues (NodoFiguraPedestal,
// Fase 8.4) en vez del mandala de 7 de Hábitos.
export type TipoNodoMapa = 'dia' | 'cofre_intermedio' | 'cofre_final' | 'orbe_mandala' | 'orbe_figura';

export type EstadoCofre = 'bloqueado' | 'disponible' | 'reclamado';

export type InfoCofre = {
  tipo: 'intermedio' | 'final';
  estadoCofre: EstadoCofre;
  gemasMin: number;
  gemasMax: number;
  gemasReclamadas?: number;
  nodoDia: number;
  // Ciclo de maestría del nivel 7 (siempre 1 en niveles 1-6). Distingue
  // cofres del mismo nodoDia entre ciclos distintos del mismo mapa infinito.
  ciclo: number;
};

export type NodoMapaSendero = {
  estado: EstadoNodoMapa;
  icono: LucideIcon;
  id: string;
  subtitulo: string;
  titulo: string;
  tipoNodo?: TipoNodoMapa;
  cofre?: InfoCofre;
  mandala?: InfoMandalaNodo;
  figura?: FiguraTareaNodo;
};

const nodosEjercicio: NodoMapaSendero[] = [
  { estado: 'completado', icono: Check, id: 'movilidad', subtitulo: '5 min', titulo: 'Movilidad articular' },
  { estado: 'completado', icono: HeartPulse, id: 'activacion', subtitulo: '8 min', titulo: 'Activacion ligera' },
  { estado: 'activo', icono: Dumbbell, id: 'circuito', subtitulo: '12 min', titulo: 'Circuito base' },
  { estado: 'bloqueado', icono: StretchHorizontal, id: 'estiramiento', subtitulo: '6 min', titulo: 'Estiramiento final' },
  { estado: 'bloqueado', icono: Bike, id: 'recuperacion', subtitulo: 'Manana', titulo: 'Recuperacion activa' },
];

const nodosRutina: NodoMapaSendero[] = [
  { estado: 'completado', icono: Check, id: 'preparar', subtitulo: '2 min', titulo: 'Preparar el espacio' },
  { estado: 'completado', icono: Clock3, id: 'respirar', subtitulo: '3 min', titulo: 'Respirar y centrar' },
  { estado: 'activo', icono: Repeat2, id: 'ritual', subtitulo: '12 min', titulo: 'Ritual de manana' },
  { estado: 'bloqueado', icono: Dumbbell, id: 'activar', subtitulo: '8 min', titulo: 'Activar el cuerpo' },
  { estado: 'bloqueado', icono: StretchHorizontal, id: 'cerrar', subtitulo: '4 min', titulo: 'Cerrar con calma' },
];

export function obtenerNodosMapaMock(subcategoriaId: string): NodoMapaSendero[] {
  if (subcategoriaId === 'ejercicio') return nodosEjercicio;
  if (subcategoriaId === 'manana') return nodosRutina;
  return [];
}
