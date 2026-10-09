import { useQuery } from '@tanstack/react-query';

import { obtenerDetallesHabitosHoy, obtenerPanelHabitos } from '../habitos/habitos.servicio';
import { CLAVE_METAS, obtenerMetas } from '../metas/metas.servicio';
import { CLAVE_METAS_DE_RUTINAS, CLAVE_RUTINAS, obtenerMetasDeRutinas, obtenerRutinasHoy } from '../rutinas/rutinas.servicio';
import { CLAVE_TAREAS_HOY, obtenerTareasHoy } from '../tareas/tareas.servicio';

// Las cuatro lecturas de Hoy, con las mismas claves de caché que usan las
// pantallas de Hábitos, Tareas y Rutinas: completar algo allí refresca Hoy sin
// trabajo extra. Varios componentes de Hoy pueden llamar a este hook; React
// Query comparte la misma petición.
export function useDatosHoy() {
  const panelHabitos = useQuery({ queryKey: ['habitos', 'panel'], queryFn: () => obtenerPanelHabitos() });
  const detallesHabitos = useQuery({ queryKey: ['habitos', 'detalles-hoy'], queryFn: () => obtenerDetallesHabitosHoy() });
  const tareasHoy = useQuery({ queryKey: CLAVE_TAREAS_HOY, queryFn: () => obtenerTareasHoy() });
  const rutinas = useQuery({ queryKey: CLAVE_RUTINAS, queryFn: obtenerRutinasHoy });
  const consultas = [panelHabitos, detallesHabitos, tareasHoy, rutinas];
  // Metas y áreas solo sirven para filtrar por área: si cargan tarde o fallan,
  // Hoy se muestra igual (todo queda "sin área"), así que no entran en cargando/error.
  const metas = useQuery({ queryKey: CLAVE_METAS, queryFn: obtenerMetas });
  const metasDeRutinas = useQuery({ queryKey: CLAVE_METAS_DE_RUTINAS, queryFn: obtenerMetasDeRutinas });

  return {
    cargando: consultas.some((consulta) => consulta.isLoading),
    error: consultas.some((consulta) => consulta.isError),
    reintentar: () => { consultas.forEach((consulta) => { void consulta.refetch(); }); },
    habitos: panelHabitos.data?.hoy.datos,
    detallesHabitos: detallesHabitos.data,
    tareas: tareasHoy.data,
    rutinas: rutinas.data,
    metas: metas.data,
    metasDeRutinas: metasDeRutinas.data,
  };
}
