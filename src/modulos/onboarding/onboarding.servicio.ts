import { useQuery, type UseQueryOptions } from '@tanstack/react-query';
import { obtenerClienteSupabase } from '../../servicios/base-datos/supabase';

export const CLAVE_REGALO_BIENVENIDA = ['onboarding', 'regaloBienvenidaPendiente'] as const;
export const CLAVE_REGALO_TRIAL_HORIZON = ['onboarding', 'regaloTrialHorizonPendiente'] as const;

type FilaPerfil = { regalo_bienvenida_reclamado_en: string | null };
type FilaPerfilTrialHorizon = { horizon_trial_iniciado_en: string | null; regalo_trial_horizon_reclamado_en: string | null };

// true = todavía no eligió su árbol de bienvenida gratis. Si algo falla (sin
// sesión, sin fila de perfil todavía, error de red) devuelve false — nunca
// bloquea el acceso a la app por un problema de datos, falla seguro hacia
// "no hay nada pendiente".
export async function obtenerRegaloBienvenidaPendiente(): Promise<boolean> {
  const supabase = obtenerClienteSupabase();
  const { data: usuario } = await supabase.auth.getUser();
  if (!usuario?.user?.id) return false;

  const { data, error } = await supabase
    .from('perfiles_usuario')
    .select('regalo_bienvenida_reclamado_en')
    .eq('id', usuario.user.id)
    .maybeSingle();
  if (error || !data) return false;

  return (data as FilaPerfil).regalo_bienvenida_reclamado_en === null;
}

export function useRegaloBienvenidaPendiente(opciones?: Pick<UseQueryOptions<boolean>, 'enabled'>) {
  return useQuery({
    queryKey: CLAVE_REGALO_BIENVENIDA,
    queryFn: obtenerRegaloBienvenidaPendiente,
    staleTime: Infinity,
    ...opciones,
  });
}

// true = el webhook de RevenueCat ya confirmó que inició un trial de Horizon
// y todavía no reclamó la semilla extra. A diferencia del regalo de
// bienvenida, esto puede volverse true DURANTE una sesión activa (el webhook
// llega unos segundos después de la compra) — por eso NO usa staleTime
// Infinity, se apoya en el staleTime global (60s) para refrescarse solo
// mientras el usuario navega la app tras suscribirse.
export async function obtenerRegaloTrialHorizonPendiente(): Promise<boolean> {
  const supabase = obtenerClienteSupabase();
  const { data: usuario } = await supabase.auth.getUser();
  if (!usuario?.user?.id) return false;

  const { data, error } = await supabase
    .from('perfiles_usuario')
    .select('horizon_trial_iniciado_en, regalo_trial_horizon_reclamado_en')
    .eq('id', usuario.user.id)
    .maybeSingle();
  if (error || !data) return false;

  const fila = data as FilaPerfilTrialHorizon;
  return fila.horizon_trial_iniciado_en !== null && fila.regalo_trial_horizon_reclamado_en === null;
}

export function useRegaloTrialHorizonPendiente(opciones?: Pick<UseQueryOptions<boolean>, 'enabled'>) {
  return useQuery({
    queryKey: CLAVE_REGALO_TRIAL_HORIZON,
    queryFn: obtenerRegaloTrialHorizonPendiente,
    ...opciones,
  });
}
