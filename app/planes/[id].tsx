import { Redirect, useLocalSearchParams } from 'expo-router';

import { DetallePlanPantalla } from '../../src/modulos/planes/pantallas/DetallePlanPantalla';

export default function DetallePlanRoute() {
  const { id } = useLocalSearchParams<{ id?: string | string[] }>();
  const planId = Array.isArray(id) ? id[0] : id;
  return planId ? <DetallePlanPantalla id={planId} /> : <Redirect href="/tareas" />;
}
