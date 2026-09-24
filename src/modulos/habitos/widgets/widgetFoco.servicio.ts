import type { HabitoResumen } from '../tipos';

export const NOMBRE_WIDGET_HABITO_FOCO = 'HabitoFoco';

export async function sincronizarWidgetFoco(_habitos: HabitoResumen[], _esPro = true): Promise<void> {}

export async function procesarIncrementosPendientesWidget(): Promise<void> {}

export async function elegirHabitoParaWidget(_habitoId: string, _habitos: HabitoResumen[], _esPro = true): Promise<void> {}

export async function pedirAgregarWidgetFoco(): Promise<boolean> {
  return false;
}

export function suscribirIncrementoWidget(_onIncremento: () => void): () => void {
  return () => {};
}
