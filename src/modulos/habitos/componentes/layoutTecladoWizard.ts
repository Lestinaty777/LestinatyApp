export type PlataformaTeclado = 'android' | 'ios' | 'web';

export type EntradaLayoutTecladoWizard = {
  plataforma: PlataformaTeclado;
  tecladoVisible: boolean;
  altoFooter: number;
  safeAreaBottom: number;
};

export const KEYBOARD_SHOULD_PERSIST_TAPS = 'handled' as const;

export type ResultadoLayoutTecladoWizard = {
  behavior: 'padding' | 'height' | undefined;
  paddingBottomScroll: number;
  keyboardShouldPersistTaps: typeof KEYBOARD_SHOULD_PERSIST_TAPS;
};

const MARGEN_RESPIRO_TECLADO_ABIERTO = 24;

/**
 * `adjustResize` de Android no se propaga de forma confiable dentro de un
 * `Modal` nativo (crea su propia ventana) — por eso Android también necesita
 * un `behavior` explícito de `KeyboardAvoidingView`, igual que iOS.
 */
export function calcularLayoutTecladoWizard(entrada: EntradaLayoutTecladoWizard): ResultadoLayoutTecladoWizard {
  const behavior: ResultadoLayoutTecladoWizard['behavior'] =
    entrada.plataforma === 'web' ? undefined : entrada.plataforma === 'ios' ? 'padding' : 'height';

  const pisoEstable = Math.max(entrada.altoFooter, 0) + Math.max(entrada.safeAreaBottom, 0);
  const paddingBottomScroll = pisoEstable + (entrada.tecladoVisible ? MARGEN_RESPIRO_TECLADO_ABIERTO : 0);

  return { behavior, paddingBottomScroll, keyboardShouldPersistTaps: KEYBOARD_SHOULD_PERSIST_TAPS };
}
