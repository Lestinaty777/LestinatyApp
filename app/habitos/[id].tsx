import { Redirect, useLocalSearchParams, useRouter } from 'expo-router';

import { resolverIdHabito } from '../../src/modulos/habitos/detalle';
import { DetalleHabitoPantalla } from '../../src/modulos/habitos/pantallas/DetalleHabitoPantalla';

// Punto de entrada por deep-link (notificaciones, enlaces externos): dentro
// de la app, HabitosPantalla ya no navega aquí — muestra el mismo componente
// incrustado con estado local, sin salir de la pantalla.
export default function DetalleHabitoRoute() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id?: string | string[] }>();
  const habitoId = resolverIdHabito(id);
  return habitoId ? <DetalleHabitoPantalla id={habitoId} onCerrar={() => router.back()} /> : <Redirect href="/habitos" />;
}
