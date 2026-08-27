export const entorno = {
  nombreApp: 'app',
  esquemaApp: 'app',
  supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL ?? '',
  supabaseAnonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '',
  posthogKey: '',
  sentryDsn: '',
  revenueCatAppleKey: '',
  revenueCatGoogleKey: '',
};
