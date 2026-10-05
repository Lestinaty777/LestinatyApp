import { Redirect, useLocalSearchParams } from 'expo-router';

import { SesionRutinaPantalla } from '../../src/modulos/rutinas/pantallas/SesionRutinaPantalla';

export default function SesionRutinaRoute() {
  const { id } = useLocalSearchParams<{ id?: string | string[] }>();
  const rutinaId = Array.isArray(id) ? id[0] : id;
  return rutinaId ? <SesionRutinaPantalla id={rutinaId} /> : <Redirect href="/hoy" />;
}
