import type { LucideIcon } from 'lucide-react-native';
import { Bike, Check, Dumbbell, HeartPulse, StretchHorizontal } from 'lucide-react-native';

export type EstadoNodoMapa = 'activo' | 'bloqueado' | 'completado';

export type NodoMapaSendero = {
  estado: EstadoNodoMapa;
  icono: LucideIcon;
  id: string;
  subtitulo: string;
  titulo: string;
};

const nodosEjercicio: NodoMapaSendero[] = [
  { estado: 'completado', icono: Check, id: 'movilidad', subtitulo: '5 min', titulo: 'Movilidad articular' },
  { estado: 'completado', icono: HeartPulse, id: 'activacion', subtitulo: '8 min', titulo: 'Activacion ligera' },
  { estado: 'activo', icono: Dumbbell, id: 'circuito', subtitulo: '12 min', titulo: 'Circuito base' },
  { estado: 'bloqueado', icono: StretchHorizontal, id: 'estiramiento', subtitulo: '6 min', titulo: 'Estiramiento final' },
  { estado: 'bloqueado', icono: Bike, id: 'recuperacion', subtitulo: 'Manana', titulo: 'Recuperacion activa' },
];

export function obtenerNodosMapaMock(subcategoriaId: string): NodoMapaSendero[] {
  return subcategoriaId === 'ejercicio' ? nodosEjercicio : [];
}
