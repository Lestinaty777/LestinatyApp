export const entorno = {
  nombreApp: 'app',
  esquemaApp: 'app',
  abyRemotoHabilitado: process.env.EXPO_PUBLIC_ABY_REMOTO === 'true',
  supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL ?? '',
  supabaseAnonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '',
  posthogKey: '',
  sentryDsn: '',
  revenueCatAppleKey: process.env.EXPO_PUBLIC_REVENUECAT_APPLE_KEY ?? '',
  revenueCatGoogleKey: process.env.EXPO_PUBLIC_REVENUECAT_GOOGLE_KEY ?? '',
};
