import { describe, expect, it, vi } from 'vitest';

vi.mock('react-native', () => ({ Appearance: { getColorScheme: () => 'dark' } }));

describe('tema UI fijo en claro', () => {
  it('ignora el modo oscuro del sistema al inicializar', async () => {
    const { usarTemaUI } = await import('./ui');
    expect(usarTemaUI.getState().modo).toBe('light');
  });

  it('establecerModo no puede activar el modo oscuro', async () => {
    const { usarTemaUI } = await import('./ui');
    usarTemaUI.getState().establecerModo('dark');
    expect(usarTemaUI.getState().modo).toBe('light');
  });
});
