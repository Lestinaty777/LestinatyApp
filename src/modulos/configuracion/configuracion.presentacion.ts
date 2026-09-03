import { SolicitudPrivacidad, TipoSolicitudPrivacidad } from './configuracion.tipos';

const nombresSolicitudes: Record<TipoSolicitudPrivacidad, string> = {
  correccion: 'corrección de datos',
  eliminacion: 'eliminación de cuenta',
  exportacion: 'exportación de datos',
};

export function etiquetaSolicitudActiva(solicitud: SolicitudPrivacidad | undefined) {
  if (!solicitud) return null;

  const estado = solicitud.estado === 'en_proceso' ? 'en proceso' : 'pendiente';
  return `Solicitud de ${nombresSolicitudes[solicitud.tipo]} ${estado}`;
}

export function formatearFechaConfiguracion(fecha: string) {
  return new Intl.DateTimeFormat('es', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(fecha));
}

export function nombreDocumentoLegal(codigo: string) {
  const nombres: Record<string, string> = {
    comunidad: 'Reglas de comunidad',
    privacidad: 'Aviso de privacidad',
    terminos: 'Términos de uso',
    uso_ia: 'Uso de Aby e IA',
  };

  return nombres[codigo] ?? 'Documento legal';
}
