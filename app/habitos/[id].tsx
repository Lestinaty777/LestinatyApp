import { Redirect, useLocalSearchParams } from 'expo-router';

import { resolverIdHabito } from '../../src/modulos/habitos/detalle';
import { DetalleHabitoPantalla } from '../../src/modulos/habitos/pantallas/DetalleHabitoPantalla';

export default function DetalleHabitoRoute() {
  const { id } = useLocalSearchParams<{ id?: string | string[] }>();
  const habitoId = resolverIdHabito(id);
  return habitoId ? <DetalleHabitoPantalla id={habitoId} /> : <Redirect href="/habitos" />;
}
