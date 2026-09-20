/**
 * Fecha calendario LOCAL del dispositivo (no UTC) en formato YYYY-MM-DD.
 * `Date.toISOString()` da la fecha en UTC, que para cualquier usuario fuera
 * de ese huso cambia de día varias horas antes o después que su "hoy" real
 * — acá se usan los getters locales de Date (getFullYear/getMonth/getDate),
 * que sí reflejan la hora del dispositivo.
 */
export function fechaLocalDe(fecha: Date): string {
  const anio = fecha.getFullYear();
  const mes = String(fecha.getMonth() + 1).padStart(2, '0');
  const dia = String(fecha.getDate()).padStart(2, '0');
  return `${anio}-${mes}-${dia}`;
}

export function fechaLocalHoy(): string {
  return fechaLocalDe(new Date());
}

/**
 * Zona horaria IANA del dispositivo (ej. "America/Mexico_City") — la misma
 * que las funciones de la base de datos usan vía `now() at time zone
 * zona_horaria` para calcular "hoy" del lado del servidor.
 */
export function zonaHorariaDispositivo(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
  } catch {
    return 'UTC';
  }
}
