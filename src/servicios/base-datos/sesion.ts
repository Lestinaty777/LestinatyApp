export function opcionesSesionPersistente<TAlmacenamiento>(storage: TAlmacenamiento) {
  return {
    autoRefreshToken: true,
    detectSessionInUrl: false,
    flowType: 'pkce' as const,
    persistSession: true,
    storage,
  };
}

type RenovacionAutenticacion = {
  startAutoRefresh: () => void;
  stopAutoRefresh: () => void;
};

export function sincronizarRenovacionSesion(estado: string | null, auth: RenovacionAutenticacion) {
  if (estado === 'active') {
    auth.startAutoRefresh();
    return;
  }

  auth.stopAutoRefresh();
}
