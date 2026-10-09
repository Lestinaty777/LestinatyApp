export const entorno = {
  nombreApp: 'app',
  esquemaApp: 'app',
  abyRemotoHabilitado: process.env.EXPO_PUBLIC_ABY_REMOTO === 'true',
  supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL ?? '',
  supabaseAnonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '',
  // Analítica de producto: opcional. Sin clave no se envía nada (ver servicios/analitica/posthog.ts).
  posthogKey: process.env.EXPO_PUBLIC_POSTHOG_KEY ?? '',
  posthogHost: process.env.EXPO_PUBLIC_POSTHOG_HOST ?? 'https://us.i.posthog.com',
  sentryDsn: '',
  revenueCatAppleKey: process.env.EXPO_PUBLIC_REVENUECAT_APPLE_KEY ?? '',
  revenueCatGoogleKey: process.env.EXPO_PUBLIC_REVENUECAT_GOOGLE_KEY ?? '',
  // Web OAuth client ID de Google Cloud Console — NO el Android client ID.
  // Es el que Supabase valida como audience del idToken. Ver plan de
  // "Inicio de sesión con Google" para el resto de la configuración externa.
  googleWebClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID ?? '',
};

export type PlataformaEntorno = 'android' | 'ios' | 'web';

export type ResultadoValidacionEntorno = {
  valido: boolean;
  variablesFaltantesOInvalidas: string[];
};

function esUrlHttpsConHostnamePublico(valor: string | undefined): boolean {
  if (!valor) {
    return false;
  }

  try {
    const url = new URL(valor);
    if (url.protocol !== 'https:') {
      return false;
    }
    if (url.hostname === 'localhost' || url.hostname === '127.0.0.1') {
      return false;
    }
    if (/^\d{1,3}(\.\d{1,3}){3}$/.test(url.hostname)) {
      return false;
    }
    return true;
  } catch {
    return false;
  }
}

/**
 * Solo valida presencia y formato — nunca imprime valores. Usada por
 * `scripts/validar-entorno-release.mjs` (build-time) y por sus propios tests;
 * `EAS_BUILD_PLATFORM` decide qué clave de RevenueCat exigir, así iOS nunca
 * requiere la clave de Google ni viceversa.
 */
export function validarVariablesPublicasRelease(
  env: Record<string, string | undefined>,
  plataforma: PlataformaEntorno,
): ResultadoValidacionEntorno {
  const variablesFaltantesOInvalidas: string[] = [];

  if (!esUrlHttpsConHostnamePublico(env.EXPO_PUBLIC_SUPABASE_URL)) {
    variablesFaltantesOInvalidas.push('EXPO_PUBLIC_SUPABASE_URL');
  }
  if (!env.EXPO_PUBLIC_SUPABASE_ANON_KEY) {
    variablesFaltantesOInvalidas.push('EXPO_PUBLIC_SUPABASE_ANON_KEY');
  }
  if (plataforma === 'ios' && !env.EXPO_PUBLIC_REVENUECAT_APPLE_KEY) {
    variablesFaltantesOInvalidas.push('EXPO_PUBLIC_REVENUECAT_APPLE_KEY');
  }
  if (plataforma === 'android' && !env.EXPO_PUBLIC_REVENUECAT_GOOGLE_KEY) {
    variablesFaltantesOInvalidas.push('EXPO_PUBLIC_REVENUECAT_GOOGLE_KEY');
  }
  // EXPO_PUBLIC_ABY_REMOTO es opcional a propósito: Aby remoto (Gemini) está
  // apagado por defecto y así debe seguir hasta que la política de
  // privacidad publicada declare ese procesamiento — no se exige aquí.

  return { valido: variablesFaltantesOInvalidas.length === 0, variablesFaltantesOInvalidas };
}
