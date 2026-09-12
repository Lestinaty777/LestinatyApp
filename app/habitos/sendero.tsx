import { Redirect, useLocalSearchParams } from 'expo-router';

import { resolverIdHabito } from '../../src/modulos/habitos/detalle';
import { SenderoHabitoPantalla } from '../../src/modulos/habitos/pantallas/SenderoHabitoPantalla';

export default function SenderoHabitoRoute() {
  const { id } = useLocalSearchParams<{ id?: string | string[] }>();
  const habitoId = resolverIdHabito(id);
  return habitoId ? <SenderoHabitoPantalla id={habitoId} /> : <Redirect href="/habitos" />;
}
