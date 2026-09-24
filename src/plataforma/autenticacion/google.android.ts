import { GoogleSignin, isCancelledResponse, isSuccessResponse } from '@react-native-google-signin/google-signin';

import { entorno } from '../../nucleo/configuracion/entorno';
import { obtenerClienteSupabase } from '../../servicios/base-datos/supabase';
import { i18n } from '../../servicios/i18n/i18n';
import type { ResultadoAccesoGoogle } from './google';

let inicializado = false;

function mapearUsuarioSesion(user: { id: string; email?: string | null }) {
  return { id: user.id, email: user.email ?? '' };
}

function obtenerMensajeError(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }

  return i18n.t('validation.genericAction');
}

// Mismo patrón que oneSignal.ts/revenueCat.ts: se inicializa una vez al
// arrancar la app. Sin webClientId configurado (todavía no hay credenciales
// de Google Cloud) simplemente no hace nada — no rompe la app en desarrollo.
export function inicializarGoogle(): void {
  if (inicializado || !entorno.googleWebClientId) return;
  inicializado = true;
  GoogleSignin.configure({ webClientId: entorno.googleWebClientId });
}

// `codigoReferido`: a diferencia de crearCuentaConEmail (signUp SÍ acepta
// options.data), signInWithIdToken no tiene forma de mandar
// raw_user_meta_data en esta versión del cliente — el trigger de auth.users
// nunca se entera. Por eso el código se aplica DESPUÉS, con un RPC propio
// (aplicar_codigo_referido, idempotente: no hace nada si la cuenta ya tenía
// un referente o si el código no existe) en vez de en el alta misma.
export async function iniciarSesionConGoogle(codigoReferido?: string): Promise<ResultadoAccesoGoogle> {
  await GoogleSignin.hasPlayServices();
  const respuesta = await GoogleSignin.signIn();

  if (isCancelledResponse(respuesta)) {
    return { estado: 'cancelado' };
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

  if (!data.user) {
    throw new Error('No pudimos obtener tu identidad de Google. Intentá de nuevo.');
  }

  return { estado: 'autenticado', usuario: mapearUsuarioSesion(data.user) };
}
