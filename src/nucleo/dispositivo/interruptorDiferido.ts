/**
 * Coordina un "iniciar" async con un "detener" síncrono que puede llegar
 * mientras el iniciar todavía está esperando algo (una sesión de audio, una
 * carga...). `detener()` apaga la bandera al instante, sin await; quien está
 * iniciando revisa `sigueDeseado()` después de cada punto de espera para
 * poder abortar aunque el detener haya llegado primero — así el efecto tardío
 * (por ejemplo, reproducir un sonido) nunca gana la carrera contra un
 * "detener" que ya se pidió.
 *
 * Puro y sin dependencias nativas a propósito, para poder probarse aparte:
 * extraído de la lluvia en loop de senderos (ver sonido.ts), donde esta
 * misma carrera dejaba la lluvia sonando después de salir de la pantalla.
 */
export function crearBanderaDeseada() {
  let deseado = false;
  return {
    iniciar: () => { deseado = true; },
    detener: () => { deseado = false; },
    sigueDeseado: () => deseado,
  };
}
