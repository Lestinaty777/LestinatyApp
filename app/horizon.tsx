import { Redirect, useLocalSearchParams } from 'expo-router';

import { HorizonPaywallPantalla } from '../src/modulos/habitos/pantallas/HorizonPaywallPantalla';
import { capacidades } from '../src/plataforma/capacidades';

// Horizon hoy solo desbloquea widgets y Planes con Aby — no se ofrece la
// suscripción donde no hay ninguno de los dos, para no venderla sin ningún
// beneficio real detrás.
export default function HorizonRoute() {
  const { volver } = useLocalSearchParams<{ volver?: string }>();
  if (!capacidades.horizon) {
    return <Redirect href="/(principal)/hoy" />;
  }
  return <HorizonPaywallPantalla volver={volver} />;
}
