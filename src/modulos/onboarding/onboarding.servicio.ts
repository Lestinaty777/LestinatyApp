import { useQuery, type UseQueryOptions } from '@tanstack/react-query';
import { obtenerClienteSupabase } from '../../servicios/base-datos/supabase';

export const CLAVE_REGALO_BIENVENIDA = ['onboarding', 'regaloBienvenidaPendiente'] as const;

type FilaPerfil = { regalo_bienvenida_reclamado_en: string | null };

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
