export type EstadoIntegracion =
  | { estado: 'lista' }
  | { estado: 'no_disponible'; motivo: 'plataforma' }
  | { estado: 'no_configurada'; motivo: string }
  | { estado: 'error'; mensajeSeguro: string };

export type ResultadoPermisoNotificaciones =
  | { estado: 'concedido' }
  | { estado: 'denegado' }
  | { estado: 'no_disponible'; motivo: 'plataforma' }
  | { estado: 'error'; mensajeSeguro: string };
