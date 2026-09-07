import { Redirect } from 'expo-router';

import { usarEstadoAcceso } from '../src/modulos/acceso/acceso.estado';

export default function Entrada() {
  const cargandoSesion = usarEstadoAcceso((estado) => estado.cargandoSesion);
  const usuario = usarEstadoAcceso((estado) => estado.usuario);

  if (cargandoSesion) {
    return null;
  }

  if (!usuario) {
    return <Redirect href="/(publico)/iniciar-sesion" />;
  }

  return <Redirect href="/(principal)/hoy" />;
}
