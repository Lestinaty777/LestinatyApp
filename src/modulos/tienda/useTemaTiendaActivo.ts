import { useQuery } from '@tanstack/react-query';

import type { ColorMaster } from '../../diseno/componentes/MasterChanger';
import { obtenerComprasTienda } from './gemas.servicio';
import { ID_PAQUETE_ARCOIRIS, colorMasterDelDia } from './temaDiario';

// Punto único de verdad para "¿hoy toca tema de color?" — la UI de inicio
// (ilustración + partículas, pendiente de arte) solo necesita este hook.
export function useTemaTiendaActivo(): { cargando: boolean; colorDelDia: ColorMaster | null } {
  const consulta = useQuery({ queryKey: ['tienda', 'compras'], queryFn: obtenerComprasTienda, staleTime: 5 * 60_000 });
  const poseeArcoiris = consulta.data?.some((compra) => compra.articuloId === ID_PAQUETE_ARCOIRIS) ?? false;
  return { cargando: consulta.isLoading, colorDelDia: poseeArcoiris ? colorMasterDelDia() : null };
}
