import { useQuery } from '@tanstack/react-query';

import { obtenerSaldoGemas } from './gemas.servicio';

// Clave compartida: cualquier compra debe invalidar esto para refrescar el
// saldo mostrado en Hoy, Hábitos, Rutinas, etc. sin recargar cada pantalla.
export const CLAVE_SALDO_GEMAS = ['tienda', 'saldoGemas'] as const;

export function useSaldoGemas() {
  return useQuery({ queryKey: CLAVE_SALDO_GEMAS, queryFn: obtenerSaldoGemas, staleTime: 30_000 });
}
