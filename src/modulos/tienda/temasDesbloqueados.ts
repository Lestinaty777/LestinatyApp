import { TONO_ESMERALDA } from '../../diseno/tema/masterColor';

// Un tema global (el tono de un paquete aplicado a toda la app) se desbloquea por POSESIÓN del paquete:
// haberlo tenido alguna vez, aunque la semilla ya se haya gastado plantándola en un hábito. Por eso se lee del
// registro durable `usuario_paquetes_desbloqueados` y NUNCA de las semillas disponibles: una semilla gastada
// sigue contando (ver supabase/migrations/20260921_44_paquetes_desbloqueados.sql).

export const ID_TEMA_GRATUITO = 'esmeralda';

export type RarezaTema = 'gratis' | 'legendario' | 'unico';
export type PaqueteCatalogoTema = { id: string; nombre: string; masterPackColor: string; rareza?: 'legendario' | 'unico' };
export type OpcionTema = { bloqueado: boolean; id: string; masterPackColor: string; nombre: string; rareza: RarezaTema };

/** Esmeralda siempre primero y libre; luego los paquetes premium, con los desbloqueados por delante. */
export function opcionesDeTema(catalogo: readonly PaqueteCatalogoTema[], desbloqueados: readonly string[]): OpcionTema[] {
  const propios = new Set(desbloqueados);
  const premium = catalogo
    .filter((paquete) => paquete.id !== ID_TEMA_GRATUITO)
    .map((paquete): OpcionTema => ({ bloqueado: !propios.has(paquete.id), id: paquete.id, masterPackColor: paquete.masterPackColor, nombre: paquete.nombre, rareza: paquete.rareza ?? 'legendario' }))
    .sort((a, b) => Number(a.bloqueado) - Number(b.bloqueado) || a.nombre.localeCompare(b.nombre));
  return [{ bloqueado: false, id: ID_TEMA_GRATUITO, masterPackColor: TONO_ESMERALDA.acento, nombre: 'Esmeralda', rareza: 'gratis' }, ...premium];
}

/** ¿El tema guardado en el dispositivo sigue siendo válido para este usuario? (otra cuenta, o una preferencia que no le corresponde, se revoca). */
export function temaSigueVigente(preferenciaId: string | null | undefined, desbloqueados: readonly string[]): boolean {
  return !preferenciaId || preferenciaId === ID_TEMA_GRATUITO || desbloqueados.includes(preferenciaId);
}
