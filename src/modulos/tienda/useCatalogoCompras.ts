import { useQuery } from '@tanstack/react-query';
import { Platform } from 'react-native';

import { obtenerCatalogoGemas } from '../../nucleo/compras/revenueCat';
import type { PaqueteCompra } from '../../plataforma/compras/contrato';

// Antes cada pantalla pedía el catálogo una sola vez al montarse y, si la
// primera llamada fallaba o llegaba vacía (frecuente en el arranque en frío de
// TestFlight), se quedaba sin precios para siempre. Ahora un catálogo que no
// llega listo o llega vacío cuenta como fallo: React Query reintenta con espera
// creciente y vuelve a pedirlo al reenfocar la pantalla.
export function useCatalogoCompras() {
  const consulta = useQuery({
    queryKey: ['tienda', 'catalogoRevenueCat', Platform.OS],
    queryFn: async (): Promise<PaqueteCompra[]> => {
      const estado = await obtenerCatalogoGemas();
      if (estado.estado === 'lista') {
        if (estado.paquetes.length === 0) throw new Error('RevenueCat no devolvió paquetes en la oferta actual.');
        return estado.paquetes;
      }
      throw new Error('mensajeSeguro' in estado ? estado.mensajeSeguro : 'motivo' in estado ? String(estado.motivo) : 'Catálogo no disponible.');
    },
    retry: 4,
    retryDelay: (intento) => Math.min(1500 * 2 ** intento, 10000),
    staleTime: 60_000,
    refetchOnMount: 'always',
  });
  return { paquetes: consulta.data ?? [], motivoError: consulta.isError ? consulta.error.message : null };
}
