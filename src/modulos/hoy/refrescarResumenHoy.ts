import { clienteConsultas } from '../../servicios/consultas/clienteConsultas';

// Clave de la consulta del resumen de Hoy (racha, días activos y XP). Vive aquí,
// sin dependencias de red, para que cualquier servicio pueda pedir que se
// vuelva a leer sin importar el módulo de Hoy entero.
export const CLAVE_RESUMEN_HOY = ['hoy', 'resumen'] as const;

/**
 * Pide que el XP y la racha se vuelvan a leer. La llaman los servicios que
 * registran una acción (hábito, tarea, sesión de rutina): son el único punto
 * común a todas las pantallas desde las que se completa algo. Nunca lanza.
 */
export function refrescarResumenHoy(): void {
  void clienteConsultas.invalidateQueries({ queryKey: CLAVE_RESUMEN_HOY }).catch(() => undefined);
}
