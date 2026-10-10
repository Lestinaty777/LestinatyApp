import type { Rutina } from './rutinas.tipos';

/** Días hacia atrás que se miran para calcular la racha (y que se piden al servidor). */
export const VENTANA_RACHA_RUTINA_DIAS = 120;

function fechaDesdeLocal(fecha: string): Date {
  return new Date(`${fecha}T12:00:00`);
}

function aFechaLocal(fecha: Date): string {
  const anio = fecha.getFullYear();
  const mes = String(fecha.getMonth() + 1).padStart(2, '0');
  const dia = String(fecha.getDate()).padStart(2, '0');
  return `${anio}-${mes}-${dia}`;
}

/** ¿La rutina está programada ese día? isodow: 1 = lunes … 7 = domingo. */
export function rutinaTocaEnFecha(rutina: Pick<Rutina, 'frecuencia' | 'diasSemana'>, fechaLocal: string): boolean {
  if (rutina.frecuencia === 'diaria') return true;
  const isodow = ((fechaDesdeLocal(fechaLocal).getDay() + 6) % 7) + 1;
  return Boolean(rutina.diasSemana?.includes(isodow));
}

/**
 * Racha de sesiones: días seguidos EN LOS QUE LA RUTINA TOCABA con la sesión
 * completa. Un día que no tocaba no suma ni rompe. Hoy, si toca y aún no está
 * completa, tampoco rompe: la racha se cuenta hasta ayer.
 */
export function calcularRachaRutina(
  fechasCompletadas: ReadonlySet<string>,
  rutina: Pick<Rutina, 'frecuencia' | 'diasSemana'>,
  hoy: string,
  ventanaDias: number = VENTANA_RACHA_RUTINA_DIAS,
): number {
  const cursor = fechaDesdeLocal(hoy);
  let racha = 0;
  for (let indice = 0; indice < ventanaDias; indice += 1) {
    const fecha = aFechaLocal(cursor);
    if (rutinaTocaEnFecha(rutina, fecha)) {
      if (fechasCompletadas.has(fecha)) racha += 1;
      else if (fecha !== hoy) break;
    }
    cursor.setDate(cursor.getDate() - 1);
  }
  return racha;
}

/** Agrupa las filas de rutinas_registros completas por rutina. */
export function agruparFechasPorRutina(filas: readonly { rutinaId: string; fechaLocal: string }[]): Map<string, Set<string>> {
  const mapa = new Map<string, Set<string>>();
  for (const fila of filas) {
    const fechas = mapa.get(fila.rutinaId) ?? new Set<string>();
    fechas.add(fila.fechaLocal);
    mapa.set(fila.rutinaId, fechas);
  }
  return mapa;
}

/**
 * Días de la semana en curso (lunes a domingo, isodow 1..7) en los que se
 * completó al menos una sesión de cualquier rutina. Para los siete puntos del
 * widget "Siguiente sesión". Los días posteriores a hoy nunca aparecen.
 */
export function diasConSesionEstaSemana(filas: readonly { fechaLocal: string }[], hoy: string): number[] {
  const fechaHoy = fechaDesdeLocal(hoy);
  const isodowHoy = ((fechaHoy.getDay() + 6) % 7) + 1;
  const lunes = new Date(fechaHoy);
  lunes.setDate(lunes.getDate() - (isodowHoy - 1));
  const desde = aFechaLocal(lunes);
  const dias = new Set<number>();
  for (const { fechaLocal } of filas) {
    if (fechaLocal < desde || fechaLocal > hoy) continue;
    dias.add(((fechaDesdeLocal(fechaLocal).getDay() + 6) % 7) + 1);
  }
  return [...dias].sort((a, b) => a - b);
}
