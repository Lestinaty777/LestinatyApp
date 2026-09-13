import type { CategoriaMapaId } from '../algoritmo/mapaProcedural';

export type CategoriaMapaMvp = 'habitos' | 'rutinas' | 'tareas';
export type IconoModuloMapa = 'actividad' | 'ciencia' | 'checklist' | 'libro' | 'usuarios';

export type ModuloCategoriaMapa = {
  categoriaId: CategoriaMapaId;
  color: string;
  descripcion: string;
  icono: IconoModuloMapa;
  id: string;
  subcategoriaId: string;
  titulo: string;
};

export const categoriaInicialMapa: CategoriaMapaMvp = 'habitos';

export const coloresSelectorCategoria: Record<CategoriaMapaMvp, string> = {
  habitos: '#D94640',
  rutinas: '#2878D4',
  tareas: '#E5A900',
};

export const modulosPorCategoria: Record<CategoriaMapaMvp, readonly ModuloCategoriaMapa[]> = {
  habitos: [
    { categoriaId: 'habitos', color: '#B34A4A', descripcion: 'Un momento breve para volver al centro.', icono: 'actividad', id: 'meditar', subcategoriaId: 'manana', titulo: 'Meditar' },
    { categoriaId: 'habitos', color: '#734AB3', descripcion: 'Una lectura pequeña, todos los días.', icono: 'libro', id: 'leer', subcategoriaId: 'manana', titulo: 'Leer diario' },
    { categoriaId: 'habitos', color: '#4A8BB3', descripcion: 'Hidratación simple durante el día.', icono: 'actividad', id: 'agua', subcategoriaId: 'ejercicio', titulo: 'Tomar agua' },
    { categoriaId: 'habitos', color: '#D4AF37', descripcion: 'Movimiento ligero para activar tu día.', icono: 'actividad', id: 'caminar', subcategoriaId: 'ejercicio', titulo: 'Caminar' },
    { categoriaId: 'habitos', color: '#8E3DFF', descripcion: 'Un registro breve de tu avance.', icono: 'libro', id: 'diario', subcategoriaId: 'manana', titulo: 'Escribir diario' },
  ],
  rutinas: [
    { categoriaId: 'rutinas', color: '#4A8BB3', descripcion: 'Una secuencia ligera para comenzar con claridad.', icono: 'actividad', id: 'manana', subcategoriaId: 'manana', titulo: 'Rutina de mañana' },
    { categoriaId: 'rutinas', color: '#1463FF', descripcion: 'Bloques simples para proteger tu concentración.', icono: 'checklist', id: 'enfoque', subcategoriaId: 'ejercicio', titulo: 'Bloque de enfoque' },
    { categoriaId: 'rutinas', color: '#734AB3', descripcion: 'Cierre amable para terminar el día.', icono: 'libro', id: 'noche', subcategoriaId: 'manana', titulo: 'Rutina de noche' },
  ],
  tareas: [
    { categoriaId: 'tareas', color: '#D4AF37', descripcion: 'Un proyecto grande convertido en pasos concretos.', icono: 'checklist', id: 'proyecto-principal', subcategoriaId: 'ejercicio', titulo: 'Organizar proyecto principal' },
  ],
};
