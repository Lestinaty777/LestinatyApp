import { describe, expect, it } from 'vitest';

import { calcularLayoutTecladoWizard } from './layoutTecladoWizard';

describe('calcularLayoutTecladoWizard', () => {
  it('usa behavior padding en iOS y height en Android para evitar depender solo de adjustResize dentro del Modal', () => {
    expect(calcularLayoutTecladoWizard({ plataforma: 'ios', tecladoVisible: false, altoFooter: 90, safeAreaBottom: 0 }).behavior).toBe('padding');
    expect(calcularLayoutTecladoWizard({ plataforma: 'android', tecladoVisible: false, altoFooter: 90, safeAreaBottom: 0 }).behavior).toBe('height');
  });

  it('no aplica avoidance en web', () => {
    expect(calcularLayoutTecladoWizard({ plataforma: 'web', tecladoVisible: true, altoFooter: 90, safeAreaBottom: 0 }).behavior).toBeUndefined();
  });

  it('el footer siempre forma parte del área evitada, incluso con el teclado oculto', () => {
    const resultado = calcularLayoutTecladoWizard({ plataforma: 'android', tecladoVisible: false, altoFooter: 90, safeAreaBottom: 20 });
    expect(resultado.paddingBottomScroll).toBeGreaterThanOrEqual(90 + 20);
  });

  it('no suma la altura completa del teclado como padding adicional (la evita el KeyboardAvoidingView, no el padding)', () => {
    const oculto = calcularLayoutTecladoWizard({ plataforma: 'android', tecladoVisible: false, altoFooter: 90, safeAreaBottom: 20 });
    const visible = calcularLayoutTecladoWizard({ plataforma: 'android', tecladoVisible: true, altoFooter: 90, safeAreaBottom: 20 });
    // El padding con teclado visible solo agrega un margen chico de respiro, nunca ~300px de un teclado completo.
    expect(visible.paddingBottomScroll - oculto.paddingBottomScroll).toBeLessThan(40);
  });

  it('respeta safe area 0 y positiva', () => {
    const sinSafeArea = calcularLayoutTecladoWizard({ plataforma: 'ios', tecladoVisible: false, altoFooter: 90, safeAreaBottom: 0 });
    const conSafeArea = calcularLayoutTecladoWizard({ plataforma: 'ios', tecladoVisible: false, altoFooter: 90, safeAreaBottom: 34 });
    expect(conSafeArea.paddingBottomScroll).toBeGreaterThan(sinSafeArea.paddingBottomScroll);
  });

  it('mantiene keyboardShouldPersistTaps en handled en toda plataforma y estado', () => {
    expect(calcularLayoutTecladoWizard({ plataforma: 'ios', tecladoVisible: true, altoFooter: 90, safeAreaBottom: 34 }).keyboardShouldPersistTaps).toBe('handled');
    expect(calcularLayoutTecladoWizard({ plataforma: 'android', tecladoVisible: false, altoFooter: 90, safeAreaBottom: 0 }).keyboardShouldPersistTaps).toBe('handled');
  });
});
