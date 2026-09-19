import { GoogleSignin } from '@react-native-google-signin/google-signin';

import { entorno } from '../../nucleo/configuracion/entorno';

let inicializado = false;

// Mismo patrón que oneSignal.ts/revenueCat.ts: se inicializa una vez al
// arrancar la app. Sin webClientId configurado (todavía no hay credenciales
// de Google Cloud) simplemente no hace nada — no rompe la app en desarrollo.
export function inicializarGoogleSignIn() {
  if (inicializado || !entorno.googleWebClientId) return;
  inicializado = true;
  GoogleSignin.configure({ webClientId: entorno.googleWebClientId });
}
