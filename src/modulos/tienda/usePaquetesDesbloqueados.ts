import { useQuery } from '@tanstack/react-query';

import { obtenerPaquetesDesbloqueados } from './gemas.servicio';

// Clave compartida: cualquier compra o regalo de semillas debe invalidarla.
export const CLAVE_PAQUETES_DESBLOQUEADOS = ['tienda', 'paquetesDesbloqueados'] as const;

export function usePaquetesDesbloqueados() {
  return useQuery({ queryKey: CLAVE_PAQUETES_DESBLOQUEADOS, queryFn: obtenerPaquetesDesbloqueados });
}
