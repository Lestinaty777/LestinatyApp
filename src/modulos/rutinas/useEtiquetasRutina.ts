import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { nombreRutinasDe, rutinasPorOrigen } from './estadoRutina';
import { CLAVE_RUTINAS, obtenerRutinasHoy } from './rutinas.servicio';

/**
 * Etiqueta "En Rutina X" por hábito y por tarea, para las pantallas de Hábitos y
 * Tareas. Si la consulta falla o aún carga, los mapas van vacíos: la etiqueta es
 * informativa y nunca debe bloquear esas pantallas.
 */
export function useEtiquetasRutina(): { habitos: Map<string, string>; tareas: Map<string, string> } {
  const { t } = useTranslation();
  const { data } = useQuery({ queryKey: CLAVE_RUTINAS, queryFn: obtenerRutinasHoy });
  return useMemo(() => {
    const origen = rutinasPorOrigen(data ?? []);
    const etiquetar = (mapa: Map<string, string[]>) => new Map(
      [...mapa].map(([id, titulos]) => [id, t('rutinas.enRutina', { nombre: nombreRutinasDe(titulos) ?? '' })] as const),
    );
    return { habitos: etiquetar(origen.habitos), tareas: etiquetar(origen.tareas) };
  }, [data, t]);
}
