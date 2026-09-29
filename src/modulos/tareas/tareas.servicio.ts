import { obtenerClienteSupabase } from '../../servicios/base-datos/supabase';
import { asignarSemillaTarea } from '../tienda/gemas.servicio';
import type { CrearTareaInput, EditarTareaInput, EstadoTarea, Tarea } from './tareas.tipos';

// A diferencia de hábitos (que pasa todo por RPCs porque tiene reglas de
// servidor: niveles, mandalas, gemas), Tareas es CRUD simple sin motor de
// progresión — RLS (tareas_items_propias) ya garantiza que cada quien solo
// lea/escriba lo suyo, así que el cliente opera directo sobre la tabla, igual
// que ya hace habitos_items en el resto de la app (ver policy espejo).
// La única excepción es "asignar una semilla", que sí es una RPC porque toca
// el inventario compartido con hábitos (usuario_semillas) y debe validarse
// en el servidor para que no se gaste la misma semilla dos veces.

type FilaTarea = {
  id: string;
  titulo: string;
  descripcion: string | null;
  estado: EstadoTarea;
  prioridad: Tarea['prioridad'];
  fecha_vencimiento: string | null;
  paquete_id: string | null;
  color: string | null;
  icono_lucide: string | null;
  orden: number;
  created_at: string;
  completada_en: string | null;
};

function normalizar(fila: FilaTarea): Tarea {
  return {
    id: fila.id,
    titulo: fila.titulo,
    descripcion: fila.descripcion,
    estado: fila.estado,
    prioridad: fila.prioridad,
    fechaVencimiento: fila.fecha_vencimiento,
    paqueteId: fila.paquete_id,
    color: fila.color,
    iconoLucide: fila.icono_lucide,
    orden: fila.orden,
    creadaEn: fila.created_at,
    completadaEn: fila.completada_en,
  };
}

const COLUMNAS = 'id, titulo, descripcion, estado, prioridad, fecha_vencimiento, paquete_id, color, icono_lucide, orden, created_at, completada_en';

async function usuarioActualId(): Promise<string> {
  const { data, error } = await obtenerClienteSupabase().auth.getUser();
  if (error) throw error;
  if (!data.user) throw new Error('Necesitas iniciar sesión para ver tus tareas.');
  return data.user.id;
}

export async function obtenerTareas(): Promise<Tarea[]> {
  const { data, error } = await obtenerClienteSupabase()
    .from('tareas_items')
    .select(COLUMNAS)
    .neq('estado', 'archivada')
    .order('orden', { ascending: true })
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data as FilaTarea[]).map(normalizar);
}

export async function crearTarea(input: CrearTareaInput): Promise<Tarea> {
  const usuarioId = await usuarioActualId();
  const { data, error } = await obtenerClienteSupabase()
    .from('tareas_items')
    .insert({
      usuario_id: usuarioId,
      titulo: input.titulo.trim(),
      descripcion: input.descripcion?.trim() || null,
      prioridad: input.prioridad ?? null,
      fecha_vencimiento: input.fechaVencimiento ?? null,
      paquete_id: input.paqueteId ?? null,
      color: input.color ?? null,
      icono_lucide: input.iconoLucide ?? null,
    })
    .select(COLUMNAS)
    .single();
  if (error) throw error;
  return normalizar(data as FilaTarea);
}

export async function editarTarea(tareaId: string, input: EditarTareaInput): Promise<Tarea> {
  const cambios: Record<string, unknown> = {};
  if (input.titulo !== undefined) cambios.titulo = input.titulo.trim();
  if (input.descripcion !== undefined) cambios.descripcion = input.descripcion?.trim() || null;
  if (input.prioridad !== undefined) cambios.prioridad = input.prioridad;
  if (input.fechaVencimiento !== undefined) cambios.fecha_vencimiento = input.fechaVencimiento;
  const { data, error } = await obtenerClienteSupabase().from('tareas_items').update(cambios).eq('id', tareaId).select(COLUMNAS).single();
  if (error) throw error;
  return normalizar(data as FilaTarea);
}

export async function completarTarea(tareaId: string, completada: boolean): Promise<Tarea> {
  const { data, error } = await obtenerClienteSupabase()
    .from('tareas_items')
    .update({ estado: completada ? 'hecha' : 'pendiente', completada_en: completada ? new Date().toISOString() : null })
    .eq('id', tareaId)
    .select(COLUMNAS)
    .single();
  if (error) throw error;
  return normalizar(data as FilaTarea);
}

export async function archivarTarea(tareaId: string): Promise<void> {
  const { error } = await obtenerClienteSupabase().from('tareas_items').update({ estado: 'archivada' }).eq('id', tareaId);
  if (error) throw error;
}

export async function eliminarTarea(tareaId: string): Promise<void> {
  const { error } = await obtenerClienteSupabase().from('tareas_items').delete().eq('id', tareaId);
  if (error) throw error;
}

export async function reordenarTareas(idsEnOrden: string[]): Promise<void> {
  const cliente = obtenerClienteSupabase();
  await Promise.all(idsEnOrden.map((id, indice) => cliente.from('tareas_items').update({ orden: indice }).eq('id', id)));
}

export { asignarSemillaTarea };
