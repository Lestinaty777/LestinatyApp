import { Redirect } from 'expo-router';

import { HorizonPaywallPantalla } from '../src/modulos/habitos/pantallas/HorizonPaywallPantalla';
import { capacidades } from '../src/plataforma/capacidades';

// Horizon hoy solo desbloquea widgets — no se ofrece la suscripción donde no
// hay widgets, para no venderla sin ningún beneficio real detrás.
export default function HorizonRoute() {
  if (!capacidades.horizon) {
    return <Redirect href="/(principal)/hoy" />;
  }
  return <HorizonPaywallPantalla />;
}
