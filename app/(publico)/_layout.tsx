import { Redirect, Stack } from 'expo-router';

import { usarEstadoAcceso } from '../../src/modulos/acceso/acceso.estado';

export default function LayoutPublico() {
  const cargandoSesion = usarEstadoAcceso((estado) => estado.cargandoSesion);
  const usuario = usarEstadoAcceso((estado) => estado.usuario);

  if (cargandoSesion) {
    return null;
  }

  if (usuario) {
    return <Redirect href="/(principal)/inicio" />;
  }

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        headerTitleAlign: 'center',
      }}
    />
  );
}
