// Nivel de la persona a partir de su XP total. El XP no se guarda: lo calcula
// public.obtener_resumen_hoy (migración 83) desde los registros; aquí solo se
// traduce a nivel. No da gemas ni desbloquea nada.

export type NivelUsuario = { nivel: number; xpEnNivel: number; xpRequerido: number; porcentaje: number };

/** XP necesario para pasar del nivel n al n+1: 60, 80, 100, 120… */
export function xpParaSubir(nivel: number): number {
  return 40 + 20 * nivel;
}

export function nivelDesdeXp(xpTotal: number): NivelUsuario {
  let restante = Number.isFinite(xpTotal) && xpTotal > 0 ? Math.floor(xpTotal) : 0;
  let nivel = 1;
  while (restante >= xpParaSubir(nivel)) {
    restante -= xpParaSubir(nivel);
    nivel += 1;
  }
  const xpRequerido = xpParaSubir(nivel);
  return { nivel, xpEnNivel: restante, xpRequerido, porcentaje: Math.round((restante / xpRequerido) * 100) };
}
