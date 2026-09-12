export type EntradaDespachoHabito = {
  dispositivoConcedido: boolean;
  mostrarNombre: boolean;
  nombreHabito: string;
  preferenciaActiva: boolean;
};

export type DecisionDespachoHabito =
  | { accion: 'cancelar'; razon: 'preferencia_inactiva' | 'sin_dispositivo' }
  | { accion: 'enviar'; cuerpo: string; titulo: string };

export function decidirDespachoHabito(entrada: EntradaDespachoHabito): DecisionDespachoHabito {
  if (!entrada.preferenciaActiva) return { accion: 'cancelar', razon: 'preferencia_inactiva' };
  if (!entrada.dispositivoConcedido) return { accion: 'cancelar', razon: 'sin_dispositivo' };
  if (!entrada.mostrarNombre) return { accion: 'enviar', cuerpo: 'Una pequeña acción cuenta hoy.', titulo: 'Es momento de tu hábito' };
  return {
    accion: 'enviar',
    cuerpo: `Tu hábito ${entrada.nombreHabito} te espera. Una pequeña acción cuenta hoy.`,
    titulo: entrada.nombreHabito,
  };
}
