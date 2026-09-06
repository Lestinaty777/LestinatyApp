import { obtenerClienteSupabase } from '../../servicios/base-datos/supabase';
import type { NodoSendero, SenderoDetalle, SenderoResumen } from './tipos';
import { mapearSenderoDetalle, type FilaSenderoRemota } from './senderos.mapper';


export async function listarSenderosActivos(): Promise<SenderoResumen[]> {
  const { data, error } = await obtenerClienteSupabase().from('senderos').select('id,titulo,descripcion,categoria_codigo,niveles:sendero_niveles!inner(id,numero,titulo,estado,nodos:sendero_nodos(id))').eq('estado', 'activo').eq('categoria_codigo', 'estudio').eq('niveles.estado', 'activo').order('created_at', { ascending: false });
  if (error) throw new Error('No pudimos cargar tus senderos.');
  return (data as FilaSenderoRemota[]).map(mapearSenderoDetalle).map(({ descripcion, id, nivelTitulo, nodosTotales, titulo }) => ({ descripcion, id, nivelTitulo, nodosTotales, titulo }));
}

export async function obtenerSendero(id: string): Promise<SenderoDetalle | null> {
  const { data, error } = await obtenerClienteSupabase().from('senderos').select('id,titulo,descripcion,categoria_codigo,niveles:sendero_niveles!inner(id,numero,titulo,estado,nodos:sendero_nodos(id,orden,tipo,titulo,descripcion,objetivo,tiempo_estimado_minutos,lesson_pack))').eq('id', id).eq('estado', 'activo').eq('categoria_codigo', 'estudio').eq('niveles.estado', 'activo').maybeSingle();
  if (error) throw new Error('No pudimos cargar este sendero.');
  return data ? mapearSenderoDetalle(data as FilaSenderoRemota) : null;
}
