import { Redirect } from 'expo-router';
import { useEffect, useState } from 'react';

import { usarEstadoAcceso } from '../src/modulos/acceso/acceso.estado';
import { haVistoIntroduccionApp } from '../src/modulos/onboarding/introduccionApp';

export default function Entrada() {
  const cargandoSesion = usarEstadoAcceso((estado) => estado.cargandoSesion);
  const usuario = usarEstadoAcceso((estado) => estado.usuario);
  const [vistaIntro, setVistaIntro] = useState<boolean | null>(null);

  useEffect(() => {
    if (usuario) return; // logueado: la intro (pre-login) ya no aplica
    haVistoIntroduccionApp().then(setVistaIntro);
  }, [usuario]);

  if (cargandoSesion) {
    return null;
  }

  if (usuario) {
    return <Redirect href="/(principal)/hoy" />;
  }

  if (vistaIntro === null) {
    return null;
  }

  if (!vistaIntro) {
    return <Redirect href="/(publico)/introduccion" />;
  }

  return <Redirect href="/(publico)/introduccion-acceso" />;
}
