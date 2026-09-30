import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { construirNodosPasos } from '../construirNodosPasos';
import { completarSubitemTarea, obtenerSubitemsTarea } from '../tareas.servicio';

// Mucho más simple que useSenderoHabito: un paso no tiene nivel, ciclo,
// mandala ni cofre — solo una lista de subitems que se completan uno a uno.
export function useSenderoPasosTarea(tareaId: string | undefined) {
  const cliente = useQueryClient();
  const clave = ['tareas', 'subitems', tareaId] as const;

  const consulta = useQuery({
    enabled: Boolean(tareaId),
    queryFn: () => obtenerSubitemsTarea(tareaId as string),
    queryKey: clave,
  });

  const completar = useMutation({
    mutationFn: ({ hecho, subitemId }: { hecho: boolean; subitemId: string }) => completarSubitemTarea(subitemId, hecho),
    onSuccess: () => cliente.invalidateQueries({ queryKey: clave }),
  });

  const subitems = consulta.data ?? [];
  const nodos = construirNodosPasos(subitems);
  const pasosCompletados = subitems.filter((subitem) => subitem.hecho).length;

  return { completar, consulta, nodos, pasosCompletados, subitems, totalPasos: subitems.length };
}
