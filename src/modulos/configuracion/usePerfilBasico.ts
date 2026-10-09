import { useQuery } from '@tanstack/react-query';

import { LIMITES_FRANJA_DEFECTO, type LimitesFranja } from '../../compartido/utilidades/franjas';
import { CLAVE_PERFIL_BASICO, obtenerPerfilBasico } from './configuracion.servicio';

/** Nombre visible y horas de inicio de cada franja. Mientras carga o si falla: sin nombre y horas por defecto. */
export function usePerfilBasico(): { nombreVisible: string; limitesFranja: LimitesFranja; cargando: boolean } {
  const consulta = useQuery({ queryKey: CLAVE_PERFIL_BASICO, queryFn: obtenerPerfilBasico, staleTime: 5 * 60 * 1000 });
  return {
    nombreVisible: consulta.data?.nombreVisible ?? '',
    limitesFranja: consulta.data?.limitesFranja ?? LIMITES_FRANJA_DEFECTO,
    cargando: consulta.isLoading,
  };
}
