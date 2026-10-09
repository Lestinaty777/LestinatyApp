import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';

import { fechaLocalHoy } from '../../nucleo/dispositivo/fechaLocal';
import { agruparFechasPorRutina, calcularRachaRutina } from './rachaRutina';
import { CLAVE_RACHAS_RUTINAS, obtenerSesionesCompletasRutinas } from './rutinas.servicio';
import type { Rutina } from './rutinas.tipos';

/** Racha de sesiones por rutina. Mientras carga o si falla, el mapa va vacío: la racha es un adorno, no bloquea. */
export function useRachasRutinas(rutinas: readonly Rutina[]): Map<string, number> {
  const { data } = useQuery({ queryKey: CLAVE_RACHAS_RUTINAS, queryFn: () => obtenerSesionesCompletasRutinas() });
  return useMemo(() => {
    const porRutina = agruparFechasPorRutina(data ?? []);
    const hoy = fechaLocalHoy();
    return new Map(rutinas.map((rutina) => [rutina.id, calcularRachaRutina(porRutina.get(rutina.id) ?? new Set(), rutina, hoy)] as const));
  }, [data, rutinas]);
}
