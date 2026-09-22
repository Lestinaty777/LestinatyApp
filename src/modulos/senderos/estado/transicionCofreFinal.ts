import type { ResultadoRegistroHabito } from '../../habitos/tipos';
import type { TransicionSendero } from '../../habitos/senderoHabito.tipos';

export type EstadoTransicionCofre = 'inactiva' | 'reproduciendo' | 'lista_para_salir';

export function transicionTrasRegistro(resultado: ResultadoRegistroHabito): {
  estado: EstadoTransicionCofre;
  transicion: TransicionSendero | null;
} {
  return resultado.transicionSendero
    ? { estado: 'reproduciendo' as const, transicion: resultado.transicionSendero }
    : { estado: 'inactiva' as const, transicion: null };
}
