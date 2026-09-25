import { PropsWithChildren, useEffect } from 'react';
import { AppState } from 'react-native';

import { obtenerClienteSupabase, supabaseEstaConfigurado } from '../../../servicios/base-datos/supabase';
import { sincronizarRenovacionSesion } from '../../../servicios/base-datos/sesion';
import { cerrarSesionOneSignal, identificarUsuarioOneSignal } from '../../../nucleo/notificaciones/oneSignal';
import { cerrarSesionCompras, iniciarSesionCompras } from '../../../nucleo/compras/revenueCat';
import { sincronizarZonaHorariaDispositivo } from '../../configuracion/configuracion.servicio';
import { sincronizarEtiquetasHabitos } from '../../habitos/etiquetasHabitos';
import { usarEstadoAcceso } from '../acceso.estado';
import { mapearUsuarioSesion } from '../acceso.servicio';

export function ProveedorAcceso({ children }: PropsWithChildren) {
  const definirCargandoSesion = usarEstadoAcceso((estado) => estado.definirCargandoSesion);
  const definirUsuario = usarEstadoAcceso((estado) => estado.definirUsuario);
  const sincronizarUsuario = (usuario: { id: string; email?: string | null } | null | undefined) => {
    definirUsuario(usuario ? mapearUsuarioSesion(usuario) : null);
    if (usuario) {
      identificarUsuarioOneSignal(usuario.id);
      void sincronizarEtiquetasHabitos().catch(() => undefined);
      iniciarSesionCompras(usuario.id);
      sincronizarZonaHorariaDispositivo();
    }
    else { cerrarSesionOneSignal(); cerrarSesionCompras(); }
  };

  useEffect(() => {
    if (!supabaseEstaConfigurado()) {
      definirUsuario(null);
      definirCargandoSesion(false);
      return;
    }

    const supabase = obtenerClienteSupabase();
    sincronizarRenovacionSesion(AppState.currentState, supabase.auth);
    const suscripcionApp = AppState.addEventListener('change', (estado) => {
      sincronizarRenovacionSesion(estado, supabase.auth);
      if (estado === 'active') sincronizarZonaHorariaDispositivo();
    });

    supabase.auth
      .getSession()
      .then(({ data }) => {
        sincronizarUsuario(data.session?.user);
      })
      .finally(() => definirCargandoSesion(false));

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((evento, session) => {
      if (evento === 'PASSWORD_RECOVERY') {
        definirCargandoSesion(false);
        return;
      }

      sincronizarUsuario(session?.user);
      definirCargandoSesion(false);
    });

    return () => {
      suscripcionApp.remove();
      subscription.unsubscribe();
    };
  }, [definirCargandoSesion, definirUsuario]);

  return <>{children}</>;
}
