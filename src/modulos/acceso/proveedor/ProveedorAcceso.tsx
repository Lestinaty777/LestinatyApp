import { PropsWithChildren, useEffect } from 'react';

import { obtenerClienteSupabase, supabaseEstaConfigurado } from '../../../servicios/base-datos/supabase';
import { usarEstadoAcceso } from '../acceso.estado';
import { mapearUsuarioSesion } from '../acceso.servicio';

export function ProveedorAcceso({ children }: PropsWithChildren) {
  const definirCargandoSesion = usarEstadoAcceso((estado) => estado.definirCargandoSesion);
  const definirUsuario = usarEstadoAcceso((estado) => estado.definirUsuario);

  useEffect(() => {
    if (!supabaseEstaConfigurado()) {
      definirUsuario(null);
      definirCargandoSesion(false);
      return;
    }

    const supabase = obtenerClienteSupabase();

    supabase.auth
      .getSession()
      .then(({ data }) => {
        definirUsuario(data.session?.user ? mapearUsuarioSesion(data.session.user) : null);
      })
      .finally(() => definirCargandoSesion(false));

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((evento, session) => {
      if (evento === 'PASSWORD_RECOVERY') {
        definirCargandoSesion(false);
        return;
      }

      definirUsuario(session?.user ? mapearUsuarioSesion(session.user) : null);
      definirCargandoSesion(false);
    });

    return () => subscription.unsubscribe();
  }, [definirCargandoSesion, definirUsuario]);

  return <>{children}</>;
}
