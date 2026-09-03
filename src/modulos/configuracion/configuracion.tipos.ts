export type TipoSolicitudPrivacidad = 'correccion' | 'eliminacion' | 'exportacion';
export type EstadoSolicitudPrivacidad = 'en_proceso' | 'pendiente';

export type PerfilConfiguracion = {
  idioma: string;
  nombreVisible: string;
  zonaHoraria: string;
};

export type PermisosDatos = {
  permiteAnaliticaProducto: boolean;
  permiteContextoAby: boolean;
  permiteProcesarFuentes: boolean;
};

export type PreferenciaNotificacion = {
  codigo: string;
  descripcion: string;
  grupo: 'evento' | 'programada' | 'proactiva';
  habilitada: boolean;
};

export type DocumentoLegal = {
  codigo: 'comunidad' | 'privacidad' | 'terminos' | 'uso_ia';
  id: string;
  idioma: string;
  urlPublica: string;
  version: string;
};

export type AceptacionLegal = DocumentoLegal & {
  aceptadoAt: string;
  origen: 'actualizacion' | 'configuracion' | 'registro';
};

export type SolicitudPrivacidad = {
  estado: EstadoSolicitudPrivacidad;
  id: string;
  solicitadaAt: string;
  tipo: TipoSolicitudPrivacidad;
};

export type ConfiguracionUsuario = {
  aceptaciones: AceptacionLegal[];
  documentos: DocumentoLegal[];
  email: string;
  permisos: PermisosDatos;
  perfil: PerfilConfiguracion;
  preferenciasNotificacion: PreferenciaNotificacion[];
  solicitudes: SolicitudPrivacidad[];
};
