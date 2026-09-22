import { obtenerClienteSupabase } from '../../servicios/base-datos/supabase';
import { mapearResumenSendero } from './senderoHabito.mapper';
import type { ResumenSenderoHabito } from './senderoHabito.tipos';

export async function obtenerResumenSenderoHabito(habitoId: string): Promise<ResumenSenderoHabito> {
  const { data, error } = await obtenerClienteSupabase().rpc('obtener_resumen_sendero_habito', { p_habito_id: habitoId });
  if (error) throw error;
  return mapearResumenSendero(data);
}

export type CofreReclamadoItem = {
  nodoDia: number;
  ciclo: number;
  tipo: 'intermedio' | 'final';
  gemas: number;
  reclamadoEn: string;
};

export async function obtenerCofresReclamadosHabito(habitoId: string, nivel: number, ciclo = 1): Promise<CofreReclamadoItem[]> {
  const { data, error } = await obtenerClienteSupabase().rpc('obtener_cofres_reclamados_habito', {
    p_habito_id: habitoId,
    p_nivel: nivel,
    p_ciclo: ciclo,
  });
  if (error) throw error;
  return ((data ?? []) as any[]).map((fila) => ({
    ciclo: Number(fila.ciclo ?? 1),
    gemas: Number(fila.gemas ?? 0),
    nodoDia: Number(fila.nodo_dia),
    reclamadoEn: String(fila.reclamado_en),
    tipo: fila.tipo as 'intermedio' | 'final',
  }));
}

export async function reclamarCofreSendero({
  habitoId,
  nivel,
  ciclo = 1,
  nodoDia,
  tipo,
}: {
  habitoId: string;
  nivel: number;
  ciclo?: number;
  nodoDia: number;
  tipo: 'intermedio' | 'final';
}): Promise<{ exito: boolean; gemas: number; tipo: string; nodoDia: number; nivel: number; ciclo: number; yaReclamado: boolean }> {
  const { data, error } = await obtenerClienteSupabase().rpc('reclamar_cofre_sendero', {
    p_habito_id: habitoId,
    p_nivel: nivel,
    p_ciclo: ciclo,
    p_nodo_dia: nodoDia,
    p_tipo: tipo,
  });
  if (error) throw error;
  const res = data as { exito: boolean; gemas: number; tipo: string; nodo_dia: number; nivel: number; ciclo: number; ya_reclamado: boolean };
  return {
    ciclo: Number(res.ciclo ?? ciclo),
    exito: Boolean(res.exito),
    gemas: Number(res.gemas ?? 0),
    nivel: Number(res.nivel ?? nivel),
    nodoDia: Number(res.nodo_dia ?? nodoDia),
    tipo: res.tipo ?? tipo,
    yaReclamado: Boolean(res.ya_reclamado),
  };
}
