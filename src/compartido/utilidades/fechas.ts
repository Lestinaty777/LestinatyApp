import { format } from 'date-fns';

export function formatearFecha(fecha: Date) {
  return format(fecha, 'dd/MM/yyyy');
}
