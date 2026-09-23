import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { hapticSeguro } from '../../../nucleo/dispositivo/haptics';
import { CLAVE_SALDO_GEMAS } from '../../tienda/useSaldoGemas';
import { obtenerTareasDiarias, reclamarTareaDiaria } from '../tareasDiarias.servicio';

export const CLAVE_TAREAS_DIARIAS = ['habitos', 'tareas-diarias'];

// Sin actualización optimista: el cofre sólo se marca reclamado y el saldo
// sólo se refresca después de la respuesta del RPC (ver spec, sección
// "React Query e invalidación").
export function useTareasDiarias() {
  const cliente = useQueryClient();

  const consulta = useQuery({ queryKey: CLAVE_TAREAS_DIARIAS, queryFn: obtenerTareasDiarias });

  const reclamar = useMutation({
    mutationFn: reclamarTareaDiaria,
    onSuccess: (resultado) => {
      cliente.invalidateQueries({ queryKey: CLAVE_TAREAS_DIARIAS });
      if (resultado.gemas > 0) cliente.invalidateQueries({ queryKey: CLAVE_SALDO_GEMAS });
      hapticSeguro('confirmacion');
    },
  });

  return { consulta, reclamar };
}
