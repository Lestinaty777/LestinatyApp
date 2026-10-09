import { entorno } from '../../nucleo/configuracion/entorno';
import { obtenerClienteSupabase } from '../base-datos/supabase';

// Analítica de producto con la API HTTP de PostHog (sin SDK nativo: no obliga
// a recompilar la app). Tres condiciones para enviar algo, todas obligatorias:
//   1) hay clave configurada (EXPO_PUBLIC_POSTHOG_KEY);
//   2) hay sesión (el evento se asocia al id de la cuenta, nunca al email);
//   3) la persona activó "analítica de producto" en sus permisos de datos
//      (privacidad.usuario_permisos_datos; nace apagado).
// Nunca lanza ni bloquea: un fallo de analítica no puede romper la app.
// Solo se envían ids, tipos, números y booleanos — nunca texto escrito por la
// persona (títulos, descripciones, notas).

export type PropiedadesEvento = Record<string, string | number | boolean | null | undefined>;

export type ContextoAnalitica = { usuarioId: string; permitido: boolean };

type Dependencias = {
  clave: string;
  host: string;
  enviar: (url: string, cuerpo: string) => Promise<unknown>;
  obtenerContexto: () => Promise<ContextoAnalitica | null>;
  ahora: () => Date;
};

/** Claves que delatan texto libre de la persona: se descartan aunque alguien las pase por error. */
const CLAVES_PROHIBIDAS = /titulo|title|descripcion|description|nota|note|nombre|name|email|texto|text/i;
const LARGO_MAXIMO_TEXTO = 64;
const VIGENCIA_CONTEXTO_MS = 5 * 60 * 1000;

export function sanearPropiedades(propiedades: PropiedadesEvento | undefined): Record<string, string | number | boolean | null> {
  const limpias: Record<string, string | number | boolean | null> = {};
  for (const [clave, valor] of Object.entries(propiedades ?? {})) {
    if (valor === undefined || CLAVES_PROHIBIDAS.test(clave)) continue;
    if (typeof valor === 'string') { if (valor.length <= LARGO_MAXIMO_TEXTO) limpias[clave] = valor; continue; }
    if (typeof valor === 'number') { if (Number.isFinite(valor)) limpias[clave] = valor; continue; }
    if (typeof valor === 'boolean' || valor === null) limpias[clave] = valor;
  }
  return limpias;
}

export function crearAnalitica(deps: Dependencias) {
  let contexto: { valor: ContextoAnalitica | null; leidoEn: number } | null = null;

  async function contextoVigente(): Promise<ContextoAnalitica | null> {
    const ahora = deps.ahora().getTime();
    if (contexto && ahora - contexto.leidoEn < VIGENCIA_CONTEXTO_MS) return contexto.valor;
    const valor = await deps.obtenerContexto();
    contexto = { valor, leidoEn: ahora };
    return valor;
  }

  return {
    /** Olvida el permiso leído: llamar al cambiar los permisos de datos o al cerrar sesión. */
    reiniciar() { contexto = null; },

    /** Devuelve true solo si el evento se entregó a la red. */
    async registrarEvento(nombre: string, propiedades?: PropiedadesEvento): Promise<boolean> {
      if (!deps.clave) return false;
      try {
        const actual = await contextoVigente();
        if (!actual || !actual.permitido) return false;
        await deps.enviar(`${deps.host.replace(/\/+$/, '')}/capture/`, JSON.stringify({
          api_key: deps.clave,
          event: nombre,
          distinct_id: actual.usuarioId,
          properties: sanearPropiedades(propiedades),
          timestamp: deps.ahora().toISOString(),
        }));
        return true;
      } catch {
        return false;
      }
    },
  };
}

async function contextoDesdeSupabase(): Promise<ContextoAnalitica | null> {
  const supabase = obtenerClienteSupabase();
  const { data: sesion } = await supabase.auth.getSession();
  const usuarioId = sesion.session?.user.id;
  if (!usuarioId) return null;
  const { data, error } = await supabase.rpc('obtener_permisos_datos');
  if (error) return { usuarioId, permitido: false };
  return { usuarioId, permitido: (data as { permite_analitica_producto?: unknown } | null)?.permite_analitica_producto === true };
}

const analitica = crearAnalitica({
  clave: entorno.posthogKey,
  host: entorno.posthogHost,
  enviar: (url, cuerpo) => fetch(url, { body: cuerpo, headers: { 'Content-Type': 'application/json' }, method: 'POST' }),
  obtenerContexto: contextoDesdeSupabase,
  ahora: () => new Date(),
});

/** Dispara y olvida: nunca lanza, nunca hay que esperarla. */
export function registrarEvento(nombre: string, propiedades?: PropiedadesEvento): void {
  void analitica.registrarEvento(nombre, propiedades);
}

export function reiniciarAnalitica(): void {
  analitica.reiniciar();
}
