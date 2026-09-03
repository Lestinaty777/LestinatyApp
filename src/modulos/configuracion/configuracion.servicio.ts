import { obtenerClienteSupabase } from '../../servicios/base-datos/supabase';
import {
  AceptacionLegal,
  ConfiguracionUsuario,
  DocumentoLegal,
  PerfilConfiguracion,
  PermisosDatos,
  PreferenciaNotificacion,
  SolicitudPrivacidad,
  TipoSolicitudPrivacidad,
} from './configuracion.tipos';
import {
  normalizarAceptacionesLegales,
  normalizarDocumentosLegales,
  normalizarPermisosDatos,
  normalizarSolicitudesPrivacidad,
} from './configuracion.normalizar';

type FilaPerfil = {
  idioma: string;
  nombre_visible: string | null;
  zona_horaria: string;
};

type FilaCatalogoNotificacion = {
  codigo: string;
  descripcion: string;
  grupo: PreferenciaNotificacion['grupo'];
};

type FilaPreferenciaNotificacion = {
  catalogo_codigo: string;
  habilitada: boolean;
};

async function obtenerUsuarioActual() {
  const supabase = obtenerClienteSupabase();
  const { data, error } = await supabase.auth.getUser();

  if (error) throw error;
  if (!data.user) throw new Error('Necesitas iniciar sesión para abrir configuración.');

  return data.user;
}

function normalizarPerfil(fila: FilaPerfil | null): PerfilConfiguracion {
  return {
    idioma: fila?.idioma || 'es',
    nombreVisible: fila?.nombre_visible || '',
    zonaHoraria: fila?.zona_horaria || 'UTC',
  };
}

function unirPreferencias(
  catalogo: FilaCatalogoNotificacion[] | null,
  preferencias: FilaPreferenciaNotificacion[] | null,
): PreferenciaNotificacion[] {
  const habilitadas = new Map((preferencias ?? []).map((preferencia) => [preferencia.catalogo_codigo, preferencia.habilitada]));

  return (catalogo ?? []).map((aviso) => ({
    codigo: aviso.codigo,
    descripcion: aviso.descripcion,
    grupo: aviso.grupo,
    habilitada: habilitadas.get(aviso.codigo) ?? false,
  }));
}

export async function cargarConfiguracion(): Promise<ConfiguracionUsuario> {
  const supabase = obtenerClienteSupabase();
  const usuario = await obtenerUsuarioActual();
  const [perfil, permisos, documentos, aceptaciones, solicitudes, catalogo, preferencias] = await Promise.all([
    supabase.from('perfiles_usuario').select('nombre_visible, idioma, zona_horaria').single(),
    supabase.rpc('obtener_permisos_datos'),
    supabase.from('documentos_legales').select('id, codigo, version, idioma, url_publica').is('retirado_at', null),
    supabase.rpc('obtener_aceptaciones_legales'),
    supabase.rpc('obtener_solicitudes_privacidad_activas'),
    supabase.from('catalogo_notificaciones').select('codigo, descripcion, grupo').eq('activo', true).order('prioridad', { ascending: false }),
    supabase.from('preferencias_notificacion_usuario').select('catalogo_codigo, habilitada'),
  ]);

  for (const resultado of [perfil, permisos, documentos, aceptaciones, solicitudes, catalogo, preferencias]) {
    if (resultado.error) throw resultado.error;
  }

  return {
    aceptaciones: normalizarAceptacionesLegales(aceptaciones.data),
    documentos: normalizarDocumentosLegales(documentos.data),
    email: usuario.email ?? '',
    perfil: normalizarPerfil(perfil.data as FilaPerfil | null),
    permisos: normalizarPermisosDatos(permisos.data),
    preferenciasNotificacion: unirPreferencias(catalogo.data as FilaCatalogoNotificacion[] | null, preferencias.data as FilaPreferenciaNotificacion[] | null),
    solicitudes: normalizarSolicitudesPrivacidad(solicitudes.data),
  };
}

export async function actualizarPerfil(perfil: PerfilConfiguracion): Promise<PerfilConfiguracion> {
  const supabase = obtenerClienteSupabase();
  const usuario = await obtenerUsuarioActual();
  const { data, error } = await supabase
    .from('perfiles_usuario')
    .update({ idioma: perfil.idioma, nombre_visible: perfil.nombreVisible.trim() || null, zona_horaria: perfil.zonaHoraria.trim() || 'UTC' })
    .eq('id', usuario.id)
    .select('nombre_visible, idioma, zona_horaria')
    .single();

  if (error) throw error;
  return normalizarPerfil(data as FilaPerfil);
}

export async function actualizarPermisosDatos(permisos: PermisosDatos): Promise<PermisosDatos> {
  const supabase = obtenerClienteSupabase();
  const { data, error } = await supabase.rpc('actualizar_permisos_datos', {
    p_permite_analitica_producto: permisos.permiteAnaliticaProducto,
    p_permite_contexto_aby: permisos.permiteContextoAby,
    p_permite_procesar_fuentes: permisos.permiteProcesarFuentes,
    p_version_aviso: '2026-09-03',
  });

  if (error) throw error;
  return normalizarPermisosDatos(data);
}

export async function actualizarPreferenciaNotificacion(codigo: string, habilitada: boolean): Promise<void> {
  const supabase = obtenerClienteSupabase();
  const { error } = await supabase
    .from('preferencias_notificacion_usuario')
    .update({ habilitada })
    .eq('catalogo_codigo', codigo);

  if (error) throw error;
}

export async function crearSolicitudPrivacidad(tipo: TipoSolicitudPrivacidad): Promise<SolicitudPrivacidad> {
  const supabase = obtenerClienteSupabase();
  const { data, error } = await supabase.rpc('crear_solicitud_privacidad', {
    p_motivo: 'Solicitud creada desde configuración.',
    p_tipo: tipo,
  });

  if (error) throw error;
  const [solicitud] = normalizarSolicitudesPrivacidad([data]);
  if (!solicitud) throw new Error('La solicitud de privacidad no devolvió un estado válido.');

  return solicitud;
}

export async function obtenerDocumentosLegales(): Promise<DocumentoLegal[]> {
  const supabase = obtenerClienteSupabase();
  const { data, error } = await supabase
    .from('documentos_legales')
    .select('id, codigo, version, idioma, url_publica')
    .is('retirado_at', null);

  if (error) throw error;
  return normalizarDocumentosLegales(data);
}

export type { AceptacionLegal };
