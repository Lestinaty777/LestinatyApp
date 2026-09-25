import { describe, expect, it, vi } from 'vitest';

vi.mock('react-native', () => ({ Platform: { OS: 'ios', Version: '17' }, NativeModules: {} }));
vi.mock('lucide-react-native', () => ({ Check: 'Check', Lock: 'Lock', Play: 'Play' }));
vi.mock('../../../nucleo/dispositivo/haptics', () => ({ hapticSeguro: vi.fn() }));
vi.mock('../habitos.servicio', () => ({
  obtenerCofresReclamadosHabito: vi.fn(),
  obtenerProgresoNivelHabito: vi.fn(),
  reclamarCofreSendero: vi.fn(),
  registrarProgresoHabito: vi.fn(),
}));

import { construirNodosDias } from '../construirNodosDias';

describe('construirNodosDias con cofres de sendero', () => {
  it('en Nivel 1 (3 días), genera 3 días de acción y el cofre final del nivel que entrega 10 gemas', () => {
    const nodos = construirNodosDias(0, 3, 1, new Map());

    expect(nodos).toHaveLength(4);
    expect(nodos[0].tipoNodo).toBe('dia');
    expect(nodos[1].tipoNodo).toBe('dia');
    expect(nodos[2].tipoNodo).toBe('dia');

    const nodoFinal = nodos[3];
    expect(nodoFinal.tipoNodo).toBe('cofre_final');
    expect(nodoFinal.cofre).toBeDefined();
    expect(nodoFinal.cofre?.tipo).toBe('final');
    expect(nodoFinal.cofre?.gemasMin).toBe(10); // 5 * (1 + 1)
    expect(nodoFinal.cofre?.gemasMax).toBe(10);
    expect(nodoFinal.cofre?.estadoCofre).toBe('bloqueado');
  });

  it('en Nivel 2 (7 días), los días 3 y 6 tienen cofres intermedios (8-15 gemas) y al final hay cofre final (15 gemas)', () => {
    const nodos = construirNodosDias(0, 7, 2, new Map());

    expect(nodos).toHaveLength(10);
    expect(nodos[0].tipoNodo).toBe('dia');
    expect(nodos[1].tipoNodo).toBe('dia');
    expect(nodos[2].tipoNodo).toBe('dia');

    // Día 3 completado tiene su cofre intermedio a continuación
    expect(nodos[3].tipoNodo).toBe('cofre_intermedio');
    expect(nodos[3].cofre?.tipo).toBe('intermedio');
    expect(nodos[3].cofre?.gemasMin).toBe(8);
    expect(nodos[3].cofre?.gemasMax).toBe(15);
    expect(nodos[3].cofre?.nodoDia).toBe(3);

    expect(nodos[4].tipoNodo).toBe('dia');
    expect(nodos[5].tipoNodo).toBe('dia');
    expect(nodos[6].tipoNodo).toBe('dia');

    // Día 6 completado tiene su cofre intermedio a continuación
    expect(nodos[7].tipoNodo).toBe('cofre_intermedio');
    expect(nodos[7].cofre?.tipo).toBe('intermedio');
    expect(nodos[7].cofre?.gemasMin).toBe(8);
    expect(nodos[7].cofre?.gemasMax).toBe(15);
    expect(nodos[7].cofre?.nodoDia).toBe(6);

    expect(nodos[8].tipoNodo).toBe('dia');

    // Día 7 completado tiene su cofre final al terminar el nivel
    expect(nodos[9].tipoNodo).toBe('cofre_final');
    expect(nodos[9].cofre?.tipo).toBe('final');
    expect(nodos[9].cofre?.gemasMin).toBe(15); // 5 * (2 + 1)
    expect(nodos[9].cofre?.gemasMax).toBe(15);
    expect(nodos[9].cofre?.nodoDia).toBe(7);
  });

  it('en Nivel 3 (12 días), genera cofres intermedios en 3, 6, 9 y final en 12 con 20 gemas', () => {
    const nodos = construirNodosDias(0, 12, 3, new Map());

    expect(nodos).toHaveLength(16);
    expect(nodos[3].tipoNodo).toBe('cofre_intermedio');
    expect(nodos[7].tipoNodo).toBe('cofre_intermedio');
    expect(nodos[11].tipoNodo).toBe('cofre_intermedio');
    expect(nodos[15].tipoNodo).toBe('cofre_final');
    expect(nodos[15].cofre?.gemasMin).toBe(20); // 5 * (3 + 1)
  });

  it('asigna estado disponible a cofres de días cumplidos y bloqueado a días futuros', () => {
    // 3 días cumplidos de 7 en nivel 2
    const nodos = construirNodosDias(3, 7, 2, new Map());

    // Día 3 completado: cofre intermedio disponible
    expect(nodos[3].cofre?.estadoCofre).toBe('disponible');
    // Día 6 no completado: cofre intermedio bloqueado
    expect(nodos[7].cofre?.estadoCofre).toBe('bloqueado');
    // Día 7 no completado: cofre final bloqueado
    expect(nodos[9].cofre?.estadoCofre).toBe('bloqueado');
  });

  it('asigna estado reclamado con gemas registradas cuando el cofre ya fue reclamado', () => {
    const mapaReclamados = new Map<number, number>([
      [3, 12], // Día 3 reclamado con 12 gemas
    ]);

    const nodos = construirNodosDias(4, 7, 2, mapaReclamados);

    expect(nodos[3].cofre?.estadoCofre).toBe('reclamado');
    expect(nodos[3].cofre?.gemasReclamadas).toBe(12);
  });

  it('el cofre final pasa a reclamado (no disponible) al completar todos los días del nivel — registrar_progreso_habito ya lo acreditó solo', () => {
    const nodos = construirNodosDias(7, 7, 2, new Map());

    expect(nodos[9].cofre?.estadoCofre).toBe('reclamado');
  });
});
