import { useQuery } from '@tanstack/react-query';

import { obtenerEstadoHorizon, type EstadoHorizon } from './horizon';

export const CLAVE_HORIZON = ['compras', 'horizon'] as const;

// ⚠️ BYPASS TEMPORAL DE DESARROLLO — pedido explícito para probar el
// paywall/widgets de Pro sin pasar por Google Play Console (license testing),
// que en Android es requisito real para completar una compra sandbox desde un
// build local. Solo toca este hook (no `obtenerEstadoHorizon`, que sigue
// siendo real y con sus tests intactos). Poner en `false` — o borrar este
// bloque entero — antes de cualquier build que no sea para esta prueba.
const FORZAR_PRO_DEV = true;

export function useHorizon() {
  const consulta = useQuery({ queryKey: CLAVE_HORIZON, queryFn: obtenerEstadoHorizon, staleTime: 30_000 });
  return FORZAR_PRO_DEV ? { ...consulta, data: 'activo' as EstadoHorizon } : consulta;
}
