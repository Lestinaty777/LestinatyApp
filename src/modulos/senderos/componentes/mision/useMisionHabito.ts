import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { obtenerProgresoNivelHabito, registrarProgresoHabito } from '../../../habitos/habitos.servicio';
import { fechaLocalHoy } from '../../../../nucleo/dispositivo/fechaLocal';
import { CLAVE_SALDO_GEMAS } from '../../../tienda/useSaldoGemas';

// Extraído de SesionMisionPantalla.tsx (no se toca ese archivo — sigue
// existiendo tal cual) para que las 3 pantallas dedicadas por tipo
// (ExperienciaNodoCheck/Cantidad/Duracion) compartan la misma query,
// mutación e invalidaciones sin duplicar el patrón tres veces.
export function useMisionHabito(habitoId: string) {
  const cliente = useQueryClient();

  const consulta = useQuery({
    enabled: Boolean(habitoId),
    queryKey: ['habitos', 'progreso-nivel', habitoId],
    queryFn: () => obtenerProgresoNivelHabito(habitoId),
  });

  const registrar = useMutation({
    mutationFn: registrarProgresoHabito,
    onSuccess: (resultado) => {
      cliente.invalidateQueries({ queryKey: ['habitos', 'progreso-nivel', habitoId] });
      cliente.invalidateQueries({ queryKey: ['habitos', 'sendero-resumen', habitoId] });
      cliente.invalidateQueries({ queryKey: ['habitos', 'mandalas', habitoId] });
      cliente.invalidateQueries({ queryKey: ['habitos', 'panel'] });
      cliente.invalidateQueries({ queryKey: ['habitos', 'detalles-hoy'] });
      cliente.invalidateQueries({ queryKey: ['habitos', 'cercania-nivel'] });
      cliente.invalidateQueries({ queryKey: ['habitos', 'mejor-racha'] });
      if (resultado.gemasGanadas > 0) cliente.invalidateQueries({ queryKey: CLAVE_SALDO_GEMAS });
    },
  });

  function enviarRegistro(valor: number) {
    registrar.mutate({ habitoId, fechaLocal: fechaLocalHoy(), valor });
  }

  return {
    consulta,
    diasCompletados: consulta.data?.diasCompletados ?? 0,
    diasRequeridos: consulta.data?.diasRequeridos ?? 7,
    enviarRegistro,
    habito: consulta.data?.habito,
    nivelActual: consulta.data?.nivel ?? 1,
    registrar,
  };
}
