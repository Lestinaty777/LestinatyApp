import { obtenerClienteSupabase } from '../../servicios/base-datos/supabase';
import {
  mapearPlantillasRutinas, mapearResultadoCompraPlantilla, type PlantillaRutina, type ResultadoCompraPlantilla,
} from './plantillasRutinas';

export const CLAVE_PLANTILLAS_RUTINAS = ['rutinas', 'plantillas'] as const;

export async function obtenerPlantillasRutinas(): Promise<PlantillaRutina[]> {
  const { data, error } = await obtenerClienteSupabase().rpc('obtener_plantillas_rutinas');
  if (error) throw error;
  return mapearPlantillasRutinas(data);
}

/** Descuenta las gemas y desbloquea la plantilla; comprar dos veces no cobra dos veces. */
export async function comprarPlantillaRutina(plantillaId: string): Promise<ResultadoCompraPlantilla> {
  const { data, error } = await obtenerClienteSupabase().rpc('comprar_plantilla_rutina', { p_plantilla_id: plantillaId });
  if (error) throw error;
  return mapearResultadoCompraPlantilla(data);
}
