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
