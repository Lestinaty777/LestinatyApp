import { obtenerClienteSupabase } from '../../servicios/base-datos/supabase';
import { mapearPanelHabitos } from './habitos.mapper';
import { PanelHabitos } from './tipos';

export async function obtenerPanelHabitos(fecha?: string): Promise<PanelHabitos> {
  const { data, error } = await obtenerClienteSupabase().rpc('obtener_panel_habitos', { p_fecha_referencia: fecha ?? null });
  if (error) throw error;
  return mapearPanelHabitos(data as Parameters<typeof mapearPanelHabitos>[0]);
}

export async function registrarProgresoHabito(input: { habitoId: string; fechaLocal: string; valor: number; nota?: string | null }) {
  const { data, error } = await obtenerClienteSupabase().rpc('registrar_progreso_habito', {
    p_habito_id: input.habitoId, p_fecha_local: input.fechaLocal, p_valor: input.valor, p_nota: input.nota ?? null,
  });
  if (error) throw error;
  return data;
}

export async function crearHabito(input: { titulo: string; meta: number; unidad: string; iconoLucide?: string; color?: string }) {
  const { data, error } = await obtenerClienteSupabase().rpc('crear_habito', {
    p_titulo: input.titulo.trim(), p_descripcion: null, p_icono_lucide: input.iconoLucide ?? 'Sparkles',
    p_color: input.color ?? '#7C3AED', p_tipo_meta: 'cantidad', p_unidad: input.unidad.trim(),
    p_frecuencia: 'diaria', p_dias_semana: null, p_veces_por_semana: null, p_objetivo_valor: input.meta,
    p_desde_fecha: new Date().toISOString().slice(0, 10),
  });
  if (error) throw error;
  return data;
}
