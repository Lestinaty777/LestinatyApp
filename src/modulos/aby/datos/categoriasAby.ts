export type CategoriaAbyId = 'rutinas' | 'salud' | 'tareas' | 'finanzas' | 'habitos' | 'relaciones' | 'estudio';

export type CategoriaAby = {
  color: string;
  id: CategoriaAbyId;
  icono: 'ciclo' | 'fuego' | 'hoja' | 'personas' | 'tareas' | 'birrete' | 'cerdito';
  mensaje: string;
  titulo: string;
};

export const categoriasAby: readonly CategoriaAby[] = [
  { color: '#4F9EEB', icono: 'ciclo', id: 'rutinas', mensaje: 'Quiero crear una rutina', titulo: 'Rutinas' },
  { color: '#4FAE63', icono: 'hoja', id: 'salud', mensaje: 'Quiero cuidar mi salud', titulo: 'Salud' },
  { color: '#E5B52A', icono: 'tareas', id: 'tareas', mensaje: 'Quiero organizar mis tareas', titulo: 'Tareas' },
  { color: '#EE8A35', icono: 'cerdito', id: 'finanzas', mensaje: 'Quiero ordenar mis finanzas', titulo: 'Finanzas' },
  { color: '#D94C4C', icono: 'fuego', id: 'habitos', mensaje: 'Quiero construir un habito', titulo: 'Habitos' },
  { color: '#D76382', icono: 'personas', id: 'relaciones', mensaje: 'Quiero cuidar mis relaciones', titulo: 'Relaciones' },
  { color: '#8459B7', icono: 'birrete', id: 'estudio', mensaje: 'Quiero mejorar mis estudios', titulo: 'Estudio' },
];

export const filasCategoriasAby = [categoriasAby.slice(0, 4), categoriasAby.slice(4)];

export function colorEnvioCategoriaAby(categoriaId: CategoriaAbyId | null) {
  return categoriasAby.find((categoria) => categoria.id === categoriaId)?.color ?? '#141414';
}

export function videoFondoCategoriaAby(categoriaId: CategoriaAbyId | null): 'rutinas' | 'salud' | 'tareas' | 'finanzas' | 'habitos' | 'relaciones' | 'estudio' {
  if (categoriaId === 'salud') return 'salud';
  if (categoriaId === 'tareas') return 'tareas';
  if (categoriaId === 'finanzas') return 'finanzas';
  if (categoriaId === 'habitos') return 'habitos';
  if (categoriaId === 'relaciones') return 'relaciones';
  if (categoriaId === 'estudio') return 'estudio';
  return 'rutinas';
}
