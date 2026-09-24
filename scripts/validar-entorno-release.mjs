// Falla temprano si el entorno de un build Release está incompleto o mal
// formado. Nunca imprime valores — solo nombres de variables. Usa
// EAS_BUILD_PLATFORM (no NODE_ENV) para decidir qué clave de RevenueCat
// exigir, así iOS nunca requiere la clave de Google ni viceversa.

const REQUERIDAS_SIEMPRE = ['EXPO_PUBLIC_SUPABASE_URL', 'EXPO_PUBLIC_SUPABASE_ANON_KEY'];

function esUrlHttpsConHostnamePublico(valor) {
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

function validar(env, plataforma) {
  const faltantes = [];

  if (!esUrlHttpsConHostnamePublico(env.EXPO_PUBLIC_SUPABASE_URL)) faltantes.push('EXPO_PUBLIC_SUPABASE_URL');
  for (const nombre of REQUERIDAS_SIEMPRE.slice(1)) {
    if (!env[nombre]) faltantes.push(nombre);
  }
  if (plataforma === 'ios' && !env.EXPO_PUBLIC_REVENUECAT_APPLE_KEY) faltantes.push('EXPO_PUBLIC_REVENUECAT_APPLE_KEY');
  if (plataforma === 'android' && !env.EXPO_PUBLIC_REVENUECAT_GOOGLE_KEY) faltantes.push('EXPO_PUBLIC_REVENUECAT_GOOGLE_KEY');
  if (env.EXPO_PUBLIC_ABY_REMOTO !== 'true') faltantes.push('EXPO_PUBLIC_ABY_REMOTO');

  const nombresSecretosProhibidos = [
    'GEMINI_API_KEY',
    'SUPABASE_SERVICE_ROLE_KEY',
    'SUPABASE_SECRET_KEY',
    'REVENUECAT_WEBHOOK_SECRET',
    'ONESIGNAL_REST_API_KEY',
    'SCHEDULER_SECRET',
  ];
  const secretosPresentes = nombresSecretosProhibidos.filter((nombre) => env[nombre] !== undefined);

  return { faltantes, secretosPresentes };
}

const plataforma = process.env.EAS_BUILD_PLATFORM ?? process.argv[2];
if (plataforma !== 'ios' && plataforma !== 'android') {
  console.error('Uso: EAS_BUILD_PLATFORM=ios|android node scripts/validar-entorno-release.mjs (o pasar la plataforma como argumento)');
  process.exit(1);
}

const { faltantes, secretosPresentes } = validar(process.env, plataforma);

if (secretosPresentes.length > 0) {
  console.error(`Secretos de backend detectados en el entorno del cliente (nunca deben llegar a EAS/bundle): ${secretosPresentes.join(', ')}`);
  process.exit(1);
}

if (faltantes.length > 0) {
  console.error(`Variables públicas requeridas ausentes o inválidas para ${plataforma}: ${faltantes.join(', ')}`);
  process.exit(1);
}

console.log(`Entorno de release válido para ${plataforma}.`);
