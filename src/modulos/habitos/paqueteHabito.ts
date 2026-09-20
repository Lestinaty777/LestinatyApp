/** Paquete visual gratuito asignado a un hábito que todavía no tiene semilla. */
export const PAQUETE_HABITO_PREDETERMINADO = 'esmeralda';

const PAQUETES_HABITO = new Set([
  'abyss', 'amber', 'aurelia', 'celesthia', 'crimsonmoon', 'diamante',
  'eclipse', 'esmeralda', 'golden', 'ignate', 'lightmoon', 'mathist',
  'moon', 'nevalhi', 'sakura', 'valvery', 'vida',
]);

/** Normaliza un id de semilla y evita que los hábitos legados vuelvan a Selva. */
export function resolverPaqueteHabito(paqueteId?: string | null): string {
  const id = paqueteId?.trim().toLowerCase();
  return id && PAQUETES_HABITO.has(id) ? id : PAQUETE_HABITO_PREDETERMINADO;
}
