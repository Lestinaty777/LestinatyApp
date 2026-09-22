// Al cambiar de hábito, subir de nivel o cerrar un ciclo de maestría, la
// selección vieja puede apuntar a un nivel que ya no existe o que todavía no
// se desbloqueó: en ese caso cae al nivel actual. Una selección válida
// (nivel ya desbloqueado) se conserva tal cual el usuario la dejó.
export function resolverNivelSeleccionado(
  nivelSeleccionado: number | undefined,
  nivelActual: number,
  nivelesDesbloqueados: number[],
): number {
  if (nivelSeleccionado === undefined || !nivelesDesbloqueados.includes(nivelSeleccionado)) {
    return nivelActual;
  }
  return nivelSeleccionado;
}

// Un nivel anterior al actual es historial: se puede consultar (scroll,
// tooltip, cofres ya reclamados) pero no registrar progreso nuevo.
export function esMapaSoloLectura(nivelSeleccionado: number, nivelActual: number): boolean {
  return nivelSeleccionado < nivelActual;
}
