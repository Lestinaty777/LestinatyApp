import { useQuery } from '@tanstack/react-query';

import { obtenerEstadoHorizon } from './horizon';

export const CLAVE_HORIZON = ['compras', 'horizon'] as const;

export function useHorizon() {
  return useQuery({ queryKey: CLAVE_HORIZON, queryFn: obtenerEstadoHorizon, staleTime: 30_000 });
}
