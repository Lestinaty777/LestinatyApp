// Días acumulados (no consecutivos, no se resetea) para llegar a cada nivel —
// misma regla real que privacidad.registrar_progreso_habito() (migración 23).
// Única fuente de verdad: los mapas derivan su cantidadNodos de acá.
export const DIAS_REQUERIDOS_POR_NIVEL: Record<number, number> = { 2: 3, 3: 7, 4: 12, 5: 18, 6: 25, 7: 33 };

// Cuántos días ya se acumularon ANTES de entrar a `nivel` — la suma de los
// requisitos de todos los niveles previos. Alimenta la numeración continua
// del sendero (Día 1..3 en nivel 1, Día 4..10 en nivel 2, etc.).
//
// Nivel 7 es maestría infinita (ciclos de 42 días, migración
// 20260922_46_progresion_senderos_infinita.sql): `ciclo` suma los 42 días de
// cada ciclo ya completado antes del actual (ciclo 1 no agrega nada).
export function diasAcumuladosAntesDeNivel(nivel: number, ciclo: number = 1): number {
  let acumulado = 0;
  for (let n = 2; n <= nivel; n++) acumulado += DIAS_REQUERIDOS_POR_NIVEL[n] ?? 0;
  if (nivel === 7) acumulado += (ciclo - 1) * 42;
  return acumulado;
}
