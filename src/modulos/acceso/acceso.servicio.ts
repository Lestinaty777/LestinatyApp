import { GoogleSignin, isCancelledResponse, isSuccessResponse } from '@react-native-google-signin/google-signin';

import { entorno } from '../../nucleo/configuracion/entorno';
import { obtenerClienteSupabase } from '../../servicios/base-datos/supabase';
import { i18n } from '../../servicios/i18n/i18n';
import { CredencialesAcceso, UsuarioSesion } from './tipos';

function mapearUsuarioSesion(user: { id: string; email?: string | null }): UsuarioSesion {
  return {
    id: user.id,
    email: user.email ?? '',
  };
}

function obtenerUrlRedireccion() {
  return `${entorno.esquemaApp}://auth/callback`;
}

function obtenerMensajeError(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }

  return i18n.t('validation.genericAction');
}

// Validación en vivo del código de un amigo, antes de crear la cuenta (sin
// sesión todavía) — RPC dedicado porque `anon` no tiene SELECT directo sobre
// perfiles_usuario (ver migración 40). false ante cualquier error de red:
// nunca debe bloquear el submit del formulario por un problema de conexión.
export async function verificarCodigoReferido(codigo: string): Promise<boolean> {
  const codigoLimpio = codigo.trim();
  if (!codigoLimpio) return false;

  const supabase = obtenerClienteSupabase();
  const { data, error } = await supabase.rpc('existe_codigo_referido', { p_codigo: codigoLimpio });

  if (error) return false;
  return Boolean(data);
}

export async function crearCuentaConEmail({ email, password }: CredencialesAcceso, codigoReferido?: string) {
  const supabase = obtenerClienteSupabase();
  const codigoLimpio = codigoReferido?.trim();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: codigoLimpio ? { codigo_referido: codigoLimpio } : undefined,
      emailRedirectTo: obtenerUrlRedireccion(),
    },
  });

  if (error) {
    throw new Error(obtenerMensajeError(error));
  }

  // Con "Confirm email" activo (como en este proyecto), signUp() para un
  // correo que YA tiene una cuenta confirmada (con cualquier proveedor, ej.
  // Google) no tira error ni crea nada — Supabase devuelve a propósito un
  // usuario "obfuscado" con `identities: []`, para no filtrar qué correos
  // están registrados. Sin este chequeo, la UI lo confundía con un signup
  // real en curso y mandaba al paso de código OTP que nunca iba a llegar.
  if (data.user && data.user.identities?.length === 0) {
    throw new Error('Ya tenés una cuenta con este correo. Iniciá sesión en vez de crear una nueva.');
  }

  return data.session?.user ? mapearUsuarioSesion(data.session.user) : null;
}

export async function verificarRegistroConOtp(email: string, token: string) {
  const supabase = obtenerClienteSupabase();
  const { data, error } = await supabase.auth.verifyOtp({
    email,
    token,
    type: 'signup',
  });

  if (error) {
    throw new Error(obtenerMensajeError(error));
  }

  return data.user ? mapearUsuarioSesion(data.user) : null;
}

export async function reenviarOtpRegistro(email: string) {
  const supabase = obtenerClienteSupabase();
  const { error } = await supabase.auth.resend({
    email,
    type: 'signup',
    options: {
      emailRedirectTo: obtenerUrlRedireccion(),
    },
  });

  if (error) {
    throw new Error(obtenerMensajeError(error));
  }
}

export async function iniciarSesionConEmail({ email, password }: CredencialesAcceso) {
  const supabase = obtenerClienteSupabase();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    throw new Error(obtenerMensajeError(error));
  }

  return data.user ? mapearUsuarioSesion(data.user) : null;
}

// null = el usuario canceló el picker de Google (no es un error a mostrar).
// Cualquier otro problema (sin idToken, Supabase rechaza el token, etc.) sí
// se propaga como error real.
//
// `codigoReferido`: a diferencia de crearCuentaConEmail (signUp SÍ acepta
// options.data), signInWithIdToken no tiene forma de mandar
// raw_user_meta_data en esta versión del cliente — el trigger de auth.users
// nunca se entera. Por eso el código se aplica DESPUÉS, con un RPC propio
// (aplicar_codigo_referido, idempotente: no hace nada si la cuenta ya tenía
// un referente o si el código no existe) en vez de en el alta misma.
export async function iniciarSesionConGoogle(codigoReferido?: string): Promise<UsuarioSesion | null> {
  await GoogleSignin.hasPlayServices();
  const respuesta = await GoogleSignin.signIn();

  if (isCancelledResponse(respuesta)) {
    return null;
  }
  if (!isSuccessResponse(respuesta) || !respuesta.data.idToken) {
    throw new Error('No pudimos obtener tu identidad de Google. Intentá de nuevo.');
  }

  const supabase = obtenerClienteSupabase();
  const { data, error } = await supabase.auth.signInWithIdToken({
    provider: 'google',
    token: respuesta.data.idToken,
  });

  if (error) {
    throw new Error(obtenerMensajeError(error));
  }

  const codigoLimpio = codigoReferido?.trim();
  if (codigoLimpio) {
    // Nunca debe tumbar el login si falla — el usuario ya quedó autenticado.
    try {
      await supabase.rpc('aplicar_codigo_referido', { p_codigo: codigoLimpio });
    } catch {
      // silencioso a propósito
    }
  }

  return data.user ? mapearUsuarioSesion(data.user) : null;
}

export async function recuperarAcceso(email: string) {
  const supabase = obtenerClienteSupabase();
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: obtenerUrlRedireccion(),
  });

  if (error) {
    throw new Error(obtenerMensajeError(error));
  }
}

export async function verificarRecuperacionConOtp(email: string, token: string) {
  const supabase = obtenerClienteSupabase();
  const { data, error } = await supabase.auth.verifyOtp({
    email,
    token,
    type: 'recovery',
  });

  if (error) {
    throw new Error(obtenerMensajeError(error));
  }

  return data.user ? mapearUsuarioSesion(data.user) : null;
}

export async function actualizarContrasenaRecuperada(password: string) {
  const supabase = obtenerClienteSupabase();
  const { error } = await supabase.auth.updateUser({ password });

  if (error) {
    throw new Error(obtenerMensajeError(error));
  }

  await supabase.auth.signOut();
}

export async function cerrarSesion() {
  const supabase = obtenerClienteSupabase();
  const { error } = await supabase.auth.signOut();

  if (error) {
    throw new Error(obtenerMensajeError(error));
  }
}

export async function limpiarSesionLocal() {
  const supabase = obtenerClienteSupabase();
  const { error } = await supabase.auth.signOut({ scope: 'local' });

  if (error) {
    throw new Error(obtenerMensajeError(error));
  }
}

export { mapearUsuarioSesion };
