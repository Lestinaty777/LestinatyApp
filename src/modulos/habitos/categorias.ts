import { esCategoriaHabitosId } from './analitica';
import { CategoriaHabitosId } from './tipos';

export function resolverCategoriaRuta(valor: string | string[] | undefined): CategoriaHabitosId | null {
  const id = Array.isArray(valor) ? valor[0] : valor;
  return id && esCategoriaHabitosId(id) ? id : null;
}
