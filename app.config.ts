import type { ConfigContext, ExpoConfig } from 'expo/config';

function esUrlHttpsConHostnamePublico(valor: string | undefined): boolean {
  if (!valor) return false;
  try {
    const url = new URL(valor);
    if (url.protocol !== 'https:') return false;
    if (url.hostname === 'localhost' || url.hostname === '127.0.0.1') return false;
    if (/^\d{1,3}(\.\d{1,3}){3}$/.test(url.hostname)) return false;
    return true;
  } catch {
    return false;
  }
}

// Falla antes de compilar si un build production/preview quedaría sin
// variables públicas válidas — nunca imprime valores, solo nombres.
function validarEntornoReleaseOFallar(perfil: string, plataforma: string | undefined) {
  if (perfil !== 'production' && perfil !== 'preview') {
    return;
  }

  const env = process.env;
  const faltantes: string[] = [];
  if (!esUrlHttpsConHostnamePublico(env.EXPO_PUBLIC_SUPABASE_URL)) faltantes.push('EXPO_PUBLIC_SUPABASE_URL');
  if (!env.EXPO_PUBLIC_SUPABASE_ANON_KEY) faltantes.push('EXPO_PUBLIC_SUPABASE_ANON_KEY');
  if (plataforma === 'ios' && !env.EXPO_PUBLIC_REVENUECAT_APPLE_KEY) faltantes.push('EXPO_PUBLIC_REVENUECAT_APPLE_KEY');
  if (plataforma === 'android' && !env.EXPO_PUBLIC_REVENUECAT_GOOGLE_KEY) faltantes.push('EXPO_PUBLIC_REVENUECAT_GOOGLE_KEY');
  // EXPO_PUBLIC_ABY_REMOTO es opcional: Aby remoto (Gemini) sigue apagado
  // hasta que la política de privacidad publicada declare ese procesamiento.

  if (faltantes.length > 0) {
    throw new Error(`Entorno ${perfil} incompleto, faltan: ${faltantes.join(', ')}`);
  }
}

export default ({ config }: ConfigContext): ExpoConfig => {
  const perfil = process.env.EAS_BUILD_PROFILE ?? 'development';
  const produccion = perfil === 'production' || perfil === 'preview';
  validarEntornoReleaseOFallar(perfil, process.env.EAS_BUILD_PLATFORM);
  const plugins = (config.plugins ?? []).map((plugin) => {
    if (Array.isArray(plugin) && plugin[0] === 'onesignal-expo-plugin') {
      return ['onesignal-expo-plugin', { disableLocation: true, mode: produccion ? 'production' : 'development' }];
    }
    return plugin;
  });

  return { ...config, plugins } as ExpoConfig;
};
