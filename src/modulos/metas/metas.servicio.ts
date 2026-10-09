import { fechaLocalHoy } from '../../nucleo/dispositivo/fechaLocal';
import { obtenerClienteSupabase } from '../../servicios/base-datos/supabase';
import type { ElementoDeMeta } from './metas.logica';
import { mapearMetas } from './metas.mapper';
import type { CrearMetaInput, EditarMetaInput, MetaVida, TipoElementoMeta } from './metas.tipos';

export const CLAVE_METAS = ['metas', 'lista'] as const;

/** Metas no archivadas con su área, sus días y lo que contienen (obtener_metas, migración 87). */
export async function obtenerMetas(): Promise<MetaVida[]> {
  const { data, error } = await obtenerClienteSupabase().rpc('obtener_metas', { p_fecha_referencia: fechaLocalHoy() });
  if (error) throw error;
  return mapearMetas(data);
}

export async function crearMeta(input: CrearMetaInput): Promise<string> {
  const supabase = obtenerClienteSupabase();
  const { data: sesion, error: errorSesion } = await supabase.auth.getUser();
  if (errorSesion) throw errorSesion;
  if (!sesion.user) throw new Error('Metas: se necesita una sesión.');
  const { data, error } = await supabase
    .from('metas')
    .insert({
      usuario_id: sesion.user.id,
      titulo: input.titulo.trim(),
      descripcion: input.descripcion?.trim() || null,
      area_id: input.areaId,
      icono_lucide: input.iconoLucide ?? null,
      color: input.color ?? null,
      duracion_dias: input.duracionDias ?? null,
      // No se deja el valor por defecto de la base (current_date es UTC): el día 1 es hoy en la zona de la persona.
      fecha_inicio: fechaLocalHoy(),
    })
    .select('id')
    .single();
  if (error) throw error;
  return (data as { id: string }).id;
}

export async function editarMeta(metaId: string, cambios: EditarMetaInput): Promise<void> {
  const fila: Record<string, unknown> = {};
  if (cambios.titulo !== undefined) fila.titulo = cambios.titulo.trim();
  if (cambios.descripcion !== undefined) fila.descripcion = cambios.descripcion?.trim() || null;
  if (cambios.areaId !== undefined) fila.area_id = cambios.areaId;
  if (cambios.iconoLucide !== undefined) fila.icono_lucide = cambios.iconoLucide;
  if (cambios.color !== undefined) fila.color = cambios.color;
  if (cambios.duracionDias !== undefined) fila.duracion_dias = cambios.duracionDias;
  if (Object.keys(fila).length === 0) return;
  const { error } = await obtenerClienteSupabase().from('metas').update(fila).eq('id', metaId);
  if (error) throw error;
}

// estado y lograda_en van siempre juntos: la base exige (estado = 'lograda') = (lograda_en no nulo).
async function cambiarEstado(metaId: string, estado: 'activa' | 'pausada' | 'lograda' | 'archivada'): Promise<void> {
  const { error } = await obtenerClienteSupabase()
    .from('metas')
    .update({ estado, lograda_en: estado === 'lograda' ? new Date().toISOString() : null })
    .eq('id', metaId);
  if (error) throw error;
}

export const marcarMetaLograda = (metaId: string) => cambiarEstado(metaId, 'lograda');
export const reabrirMeta = (metaId: string) => cambiarEstado(metaId, 'activa');
export const pausarMeta = (metaId: string) => cambiarEstado(metaId, 'pausada');
export const archivarMeta = (metaId: string) => cambiarEstado(metaId, 'archivada');

/** Enlaza un hábito, tarea, rutina o plan propios con una meta propia; `metaId` null quita la meta. */
export async function asignarMeta(tipo: TipoElementoMeta, elementoId: string, metaId: string | null): Promise<void> {
  const { error } = await obtenerClienteSupabase().rpc('asignar_meta', { p_tipo: tipo, p_elemento_id: elementoId, p_meta_id: metaId });
  if (error) throw error;
}

export const CLAVE_ELEMENTOS_DE_METAS = ['metas', 'elementos'] as const;

/**
 * Todo lo que la persona puede poner dentro de una meta, con la meta que ya
 * tiene: hábitos activos, tareas y rutinas sin archivar, y planes propios.
 * Lectura directa (RLS limita a lo propio). Si una de las cuatro falla, se
 * devuelve lo de las demás: una lista parcial es mejor que ninguna.
 */
export async function obtenerElementosDeMetas(): Promise<ElementoDeMeta[]> {
  const supabase = obtenerClienteSupabase();
  const { data: sesion } = await supabase.auth.getUser();
  const usuarioId = sesion.user?.id;
  if (!usuarioId) throw new Error('Metas: se necesita una sesión.');
  const [habitos, tareas, rutinas, planes] = await Promise.all([
    supabase.from('habitos_items').select('id, titulo, meta_id').eq('estado', 'activo').order('created_at', { ascending: true }),
    supabase.from('tareas_items').select('id, titulo, meta_id').neq('estado', 'archivada').order('orden', { ascending: true }),
    supabase.from('rutinas_items').select('id, titulo, meta_id').neq('estado', 'archivada').order('created_at', { ascending: true }),
    // Solo planes propios: en uno compartido por otra persona no se puede poner una meta.
    supabase.from('planes_items').select('id, titulo, meta_id').eq('usuario_id', usuarioId).order('created_at', { ascending: true }),
  ]);
  if (habitos.error && tareas.error && rutinas.error && planes.error) throw habitos.error;
  type Fila = { id: string; titulo: string; meta_id: string | null };
  const de = (tipo: ElementoDeMeta['tipo'], filas: unknown) => ((filas ?? []) as Fila[]).map((fila): ElementoDeMeta => ({ tipo, id: fila.id, titulo: fila.titulo, metaId: fila.meta_id }));
  return [...de('habito', habitos.data), ...de('tarea', tareas.data), ...de('rutina', rutinas.data), ...de('plan', planes.data)];
}
