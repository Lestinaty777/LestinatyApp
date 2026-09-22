// Mapas 1-6: recorrido fijo hacia el nivel siguiente. Mapa 7: maestría
// infinita en ciclos de 42 días — no hay nivel 8.
export const DIAS_POR_MAPA = { 1: 3, 2: 7, 3: 12, 4: 18, 5: 25, 6: 33, 7: 42 } as const;

// Gemas del cofre final de cada mapa. Niveles 1-6 replican la fórmula
// histórica del wizard (5 * (nivel + 1)); el ciclo de maestría del nivel 7
// paga siempre 35, sin importar cuántos ciclos ya se completaron.
export const RECOMPENSA_COFRE_FINAL = { 1: 10, 2: 15, 3: 20, 4: 25, 5: 30, 6: 35, 7: 35 } as const;

export type ProgresoMaestria = {
  ciclo: number;
  ciclosCompletados: number;
  diasCompletados: number;
  diasRequeridos: number;
  totalDias: number;
};

export function calcularProgresoMaestria(totalDiasNivel7: number): ProgresoMaestria {
  const totalDias = Math.max(0, Math.floor(totalDiasNivel7));
  const diasRequeridos = DIAS_POR_MAPA[7];
  return {
    ciclo: Math.floor(totalDias / diasRequeridos) + 1,
    ciclosCompletados: Math.floor(totalDias / diasRequeridos),
    diasCompletados: totalDias % diasRequeridos,
    diasRequeridos,
    totalDias,
  };
}
