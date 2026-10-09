import { reiniciarAnalitica } from '../../servicios/analitica/posthog';
import { obtenerClienteSupabase } from '../../servicios/base-datos/supabase';
import { LIMITES_FRANJA_DEFECTO, limitesValidos, type LimitesFranja } from '../../compartido/utilidades/franjas';
import { zonaHorariaDispositivo } from '../../nucleo/dispositivo/fechaLocal';
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

// Todas las funciones de fecha "de hoy" en la base de datos dependen de
// perfiles_usuario.zona_horaria (default 'UTC', nunca detectada sola) — esto
// la mantiene al día con la zona real del dispositivo, sin pisar el resto
// del perfil. Se llama al iniciar sesión y al volver la app a primer plano;
// silenciosa si falla (nunca debe bloquear el acceso) y no escribe si ya
// coincide, para no gastar una escritura en cada chequeo.
export async function sincronizarZonaHorariaDispositivo(): Promise<void> {
  try {
    const zona = zonaHorariaDispositivo();
    const supabase = obtenerClienteSupabase();
    const usuario = await obtenerUsuarioActual();
    const { data, error } = await supabase.from('perfiles_usuario').select('zona_horaria').eq('id', usuario.id).single();
    if (error) throw error;
    if ((data as { zona_horaria: string } | null)?.zona_horaria === zona) return;
    await supabase.from('perfiles_usuario').update({ zona_horaria: zona }).eq('id', usuario.id);
  } catch {
    // silencioso — un fallo acá nunca debe bloquear el inicio de sesión
  }
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
  reiniciarAnalitica(); // el permiso de analítica pudo cambiar: que se vuelva a leer
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

// Borrado REAL e inmediato de la cuenta (migración 20260924_49): elimina
// auth.users del usuario autenticado, lo que cascada a todos sus datos
// (perfil, hábitos, gemas, cofres, semillas, notificaciones). No queda nada
// pendiente de procesar — a diferencia de crearSolicitudPrivacidad('eliminacion'),
// que solo registraba el pedido sin borrar nada.
export async function eliminarCuentaPropia(): Promise<void> {
  const { error } = await obtenerClienteSupabase().rpc('eliminar_cuenta_propia');
  if (error) throw error;
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

// ─── Perfil básico: lo mínimo que necesitan Hoy y los asistentes ────────────
// cargarConfiguracion() hace siete consultas (permisos, documentos legales,
// notificaciones…). Para saludar por el nombre y saber a qué hora empieza cada
// franja basta una fila de perfiles_usuario.
export const CLAVE_PERFIL_BASICO = ['configuracion', 'perfilBasico'] as const;

export type PerfilBasico = { nombreVisible: string; limitesFranja: LimitesFranja };

export function normalizarPerfilBasico(fila: {
  nombre_visible?: string | null; franja_manana_desde?: number | null; franja_tarde_desde?: number | null; franja_noche_desde?: number | null;
} | null | undefined): PerfilBasico {
  const limites: LimitesFranja = {
    mananaDesde: Number(fila?.franja_manana_desde ?? LIMITES_FRANJA_DEFECTO.mananaDesde),
    tardeDesde: Number(fila?.franja_tarde_desde ?? LIMITES_FRANJA_DEFECTO.tardeDesde),
    nocheDesde: Number(fila?.franja_noche_desde ?? LIMITES_FRANJA_DEFECTO.nocheDesde),
  };
  return {
    nombreVisible: (fila?.nombre_visible ?? '').trim(),
    limitesFranja: limitesValidos(limites) ? limites : LIMITES_FRANJA_DEFECTO,
  };
}

export async function obtenerPerfilBasico(): Promise<PerfilBasico> {
  const { data, error } = await obtenerClienteSupabase()
    .from('perfiles_usuario')
    .select('nombre_visible, franja_manana_desde, franja_tarde_desde, franja_noche_desde')
    .single();
  if (error) throw error;
  return normalizarPerfilBasico(data);
}

/** Guarda a qué hora empieza cada franja. La noche cruza medianoche hasta el inicio de la mañana. */
export async function actualizarLimitesFranja(limites: LimitesFranja): Promise<LimitesFranja> {
  if (!limitesValidos(limites)) throw new Error('Configuración: los límites de franja no son válidos.');
  const usuario = await obtenerUsuarioActual();
  const { error } = await obtenerClienteSupabase()
    .from('perfiles_usuario')
    .update({ franja_manana_desde: limites.mananaDesde, franja_tarde_desde: limites.tardeDesde, franja_noche_desde: limites.nocheDesde })
    .eq('id', usuario.id);
  if (error) throw error;
  return limites;
}
