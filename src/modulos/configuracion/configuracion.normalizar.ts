import {
  AceptacionLegal,
  DocumentoLegal,
  EstadoSolicitudPrivacidad,
  PermisosDatos,
  SolicitudPrivacidad,
  TipoSolicitudPrivacidad,
} from './configuracion.tipos';

function esRegistro(valor: unknown): valor is Record<string, unknown> {
  return typeof valor === 'object' && valor !== null;
}

function esCadena(valor: unknown): valor is string {
  return typeof valor === 'string' && valor.trim().length > 0;
}

function esCodigoDocumento(valor: unknown): valor is DocumentoLegal['codigo'] {
  return valor === 'comunidad' || valor === 'privacidad' || valor === 'terminos' || valor === 'uso_ia';
}

function esOrigen(valor: unknown): valor is AceptacionLegal['origen'] {
  return valor === 'actualizacion' || valor === 'configuracion' || valor === 'registro';
}

function esTipoSolicitud(valor: unknown): valor is TipoSolicitudPrivacidad {
  return valor === 'correccion' || valor === 'eliminacion' || valor === 'exportacion';
}

function esEstadoSolicitudActivo(valor: unknown): valor is EstadoSolicitudPrivacidad {
  return valor === 'en_proceso' || valor === 'pendiente';
}

export function normalizarPermisosDatos(valor: unknown): PermisosDatos {
  if (!esRegistro(valor)) {
    throw new Error('La respuesta de permisos de datos es inválida.');
  }

  return {
    permiteAnaliticaProducto: valor.permite_analitica_producto === true,
    permiteContextoAby: valor.permite_contexto_aby === true,
    permiteProcesarFuentes: valor.permite_procesar_fuentes === true,
  };
}

export function normalizarDocumentosLegales(valor: unknown): DocumentoLegal[] {
  if (!Array.isArray(valor)) return [];

  return valor.flatMap((documento) => {
    if (!esRegistro(documento)
      || !esCadena(documento.id)
      || !esCodigoDocumento(documento.codigo)
      || !esCadena(documento.version)
      || !esCadena(documento.idioma)
      || !esCadena(documento.url_publica)) {
      return [];
    }

    return [{
      codigo: documento.codigo,
      id: documento.id,
      idioma: documento.idioma,
      urlPublica: documento.url_publica,
      version: documento.version,
    }];
  });
}

export function normalizarAceptacionesLegales(valor: unknown): AceptacionLegal[] {
  if (!Array.isArray(valor)) return [];

  return valor.flatMap((aceptacion) => {
    if (!esRegistro(aceptacion)
      || !esCadena(aceptacion.documento_id)
      || !esCodigoDocumento(aceptacion.codigo)
      || !esCadena(aceptacion.version)
      || !esCadena(aceptacion.idioma)
      || !esCadena(aceptacion.url_publica)
      || !esCadena(aceptacion.aceptado_at)
      || !esOrigen(aceptacion.origen)) {
      return [];
    }

    return [{
      aceptadoAt: aceptacion.aceptado_at,
      codigo: aceptacion.codigo,
      id: aceptacion.documento_id,
      idioma: aceptacion.idioma,
      origen: aceptacion.origen,
      urlPublica: aceptacion.url_publica,
      version: aceptacion.version,
    }];
  });
}

export function normalizarSolicitudesPrivacidad(valor: unknown): SolicitudPrivacidad[] {
  if (!Array.isArray(valor)) return [];

  return valor.flatMap((solicitud) => {
    if (!esRegistro(solicitud)
      || !esCadena(solicitud.id)
      || !esTipoSolicitud(solicitud.tipo)
      || !esEstadoSolicitudActivo(solicitud.estado)
      || !esCadena(solicitud.solicitada_at)) {
      return [];
    }

    return [{
      estado: solicitud.estado,
      id: solicitud.id,
      solicitadaAt: solicitud.solicitada_at,
      tipo: solicitud.tipo,
    }];
  });
}
