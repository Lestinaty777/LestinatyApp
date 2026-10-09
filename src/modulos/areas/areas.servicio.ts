import { obtenerClienteSupabase } from '../../servicios/base-datos/supabase';
import { mapearArea, mapearAreas } from './areas.mapper';
import type { AreaVida, CrearAreaInput } from './areas.tipos';

export const CLAVE_AREAS = ['areas', 'lista'] as const;
const COLUMNAS = 'id, usuario_id, codigo, nombre, color, icono_lucide, orden';

/** Código de error propio para "ya tienes un área con ese nombre" (violación de unicidad). */
export class ErrorAreaDuplicada extends Error {
  constructor() { super('Áreas: ya existe un área con ese nombre.'); this.name = 'ErrorAreaDuplicada'; }
}

/** Áreas del sistema más las propias sin archivar. RLS ya oculta las de otras personas. */
export async function obtenerAreas(): Promise<AreaVida[]> {
  const { data, error } = await obtenerClienteSupabase()
    .from('areas_vida')
    .select(COLUMNAS)
    .is('archivada_en', null)
    .order('orden', { ascending: true })
    .order('created_at', { ascending: true });
  if (error) throw error;
  return mapearAreas(data);
}

export async function crearArea(input: CrearAreaInput): Promise<AreaVida> {
  const supabase = obtenerClienteSupabase();
  const { data: sesion, error: errorSesion } = await supabase.auth.getUser();
  if (errorSesion) throw errorSesion;
  if (!sesion.user) throw new Error('Áreas: se necesita una sesión.');
  const { data, error } = await supabase
    .from('areas_vida')
    .insert({ usuario_id: sesion.user.id, nombre: input.nombre.trim(), color: input.color, icono_lucide: input.iconoLucide })
    .select(COLUMNAS)
    .single();
  if (error) {
    if ((error as { code?: string }).code === '23505') throw new ErrorAreaDuplicada();
    throw error;
  }
  return mapearArea(data);
}

/** Solo áreas propias (RLS impide tocar las del sistema). Las metas que la usaban la conservan hasta que se cambie. */
export async function archivarArea(areaId: string): Promise<void> {
  const { error } = await obtenerClienteSupabase().from('areas_vida').update({ archivada_en: new Date().toISOString() }).eq('id', areaId);
  if (error) throw error;
}
