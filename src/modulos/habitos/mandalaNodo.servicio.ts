import { obtenerClienteSupabase } from '../../servicios/base-datos/supabase';
import { mapearMandalasHabito, mapearResultadoGuardarMandala } from './mandalaNodo.mapper';
import type { InfoMandalaNodo, ResultadoGuardarMandala, TrazoMandala } from './mandalaNodo.tipos';

export async function obtenerMandalasHabito(habitoId: string): Promise<InfoMandalaNodo[]> {
  const { data, error } = await obtenerClienteSupabase().rpc('obtener_mandalas_habito', { p_habito_id: habitoId });
  if (error) throw error;
  return mapearMandalasHabito(data);
}

export async function guardarMandalaRegistro(registroId: string, trazos: TrazoMandala[]): Promise<ResultadoGuardarMandala> {
  const { data, error } = await obtenerClienteSupabase().rpc('guardar_mandala_registro', {
    p_registro_id: registroId,
    p_trazos: trazos,
  });
  if (error) throw error;
  return mapearResultadoGuardarMandala(data);
}
