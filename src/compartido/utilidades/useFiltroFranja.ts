import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { contarPendientesPorFiltro, filtrarPorFranja, type FiltroFranja, type FranjaDia } from './franjas';

/**
 * Estado y textos del SelectorFranja para una lista de gestión (Hábitos, Tareas).
 * Empieza en "Todo" para no esconder nada. `visible` es false cuando ningún
 * elemento tiene franja concreta: en ese caso los botones de mañana, tarde y
 * noche estarían siempre vacíos y el selector solo estorbaría.
 */
export function useFiltroFranja<T extends { franja: FranjaDia }>(items: readonly T[], esPendiente: (item: T) => boolean) {
  const { t } = useTranslation();
  const [filtro, setFiltro] = useState<FiltroFranja>('todo');
  const etiquetas = useMemo<Record<FiltroFranja, string>>(() => ({
    manana: t('franjas.manana'), tarde: t('franjas.tarde'), noche: t('franjas.noche'), todo: t('franjas.todo'),
  }), [t]);
  const visible = items.some((item) => item.franja !== 'cualquier_momento');
  const filtroEfectivo: FiltroFranja = visible ? filtro : 'todo';
  return {
    conteos: contarPendientesPorFiltro(items, esPendiente),
    etiquetaAccesible: (opcion: FiltroFranja, n: number) => t('franjas.pendientes', { franja: etiquetas[opcion], n }),
    etiquetas,
    filtrados: filtrarPorFranja(items, filtroEfectivo),
    filtro: filtroEfectivo,
    setFiltro,
    visible,
  };
}
