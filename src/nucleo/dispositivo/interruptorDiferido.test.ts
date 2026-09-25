import { describe, expect, it } from 'vitest';
import { crearBanderaDeseada } from './interruptorDiferido';

describe('crearBanderaDeseada', () => {
  it('empieza en falso', () => {
    expect(crearBanderaDeseada().sigueDeseado()).toBe(false);
  });

  it('iniciar la pone en verdadero', () => {
    const bandera = crearBanderaDeseada();
    bandera.iniciar();
    expect(bandera.sigueDeseado()).toBe(true);
  });

  it('detener la apaga aunque nunca se haya iniciado', () => {
    const bandera = crearBanderaDeseada();
    bandera.detener();
    expect(bandera.sigueDeseado()).toBe(false);
  });

  it('el caso de la carrera: detener() DESPUÉS de iniciar() dentro del mismo tick sigue dejándola en falso — así un "iniciar" que sigue esperando un await puede notar que ya se pidió parar', () => {
    const bandera = crearBanderaDeseada();
    bandera.iniciar(); // arranca el efecto que monta la pantalla (aún esperando algo async)
    bandera.detener(); // el usuario ya salió antes de que ese await terminara
    expect(bandera.sigueDeseado()).toBe(false);
  });

  it('reiniciar después de detener vuelve a quedar en verdadero (no se queda "atascada" en falso)', () => {
    const bandera = crearBanderaDeseada();
    bandera.iniciar();
    bandera.detener();
    bandera.iniciar();
    expect(bandera.sigueDeseado()).toBe(true);
  });

  it('cada bandera es independiente (dos loops distintos no se pisan)', () => {
    const a = crearBanderaDeseada();
    const b = crearBanderaDeseada();
    a.iniciar();
    expect(a.sigueDeseado()).toBe(true);
    expect(b.sigueDeseado()).toBe(false);
  });
});
