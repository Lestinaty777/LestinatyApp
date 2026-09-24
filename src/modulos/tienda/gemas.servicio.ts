import { obtenerClienteSupabase } from '../../servicios/base-datos/supabase';
import type { ArbolPaquete, ArticuloTienda, CompraTienda, PaqueteGemasIap, ResultadoCompraArticulo, ResultadoCompraSemillas, SemillaArbol } from './gemas.tipos';

// El saldo y la compra se resuelven en el schema privado `comercio` — estas
// llamadas pasan por los wrappers RPC de `public` (security invoker), nunca
// escriben la billetera ni las compras directamente. Ver
// supabase/migrations/20260912_13_comercio_tienda_gemas.sql.

export async function obtenerSaldoGemas(): Promise<number> {
  const { data, error } = await obtenerClienteSupabase().rpc('obtener_saldo_gemas');
  if (error) throw error;
  return Number(data ?? 0);
}

type FilaArticulo = { id: string; tipo: string; nombre: string; descripcion: string; precio_gemas: number };

export async function obtenerCatalogoTienda(): Promise<ArticuloTienda[]> {
  const { data, error } = await obtenerClienteSupabase().from('articulos_tienda').select('id, tipo, nombre, descripcion, precio_gemas').eq('activo', true);
  if (error) throw error;
  return (data as FilaArticulo[]).map((fila) => ({ id: fila.id, tipo: fila.tipo as ArticuloTienda['tipo'], nombre: fila.nombre, descripcion: fila.descripcion, precioGemas: Number(fila.precio_gemas) }));
}

type FilaCompra = { articulo_id: string; comprado_en: string };

export async function obtenerComprasTienda(): Promise<CompraTienda[]> {
  const { data, error } = await obtenerClienteSupabase().from('compras_tienda').select('articulo_id, comprado_en');
  if (error) throw error;
  return (data as FilaCompra[]).map((fila) => ({ articuloId: fila.articulo_id, compradoEn: fila.comprado_en }));
}

type FilaProductoIap = {
  paquete_id: string;
  product_id_revenuecat: string;
  paquete: { cantidad_gemas: number; precio_referencia_usd: number | null; activo: boolean } | null;
};

// Un mismo paquete lógico (id, cantidad, precio de referencia) tiene un
// product_id_revenuecat distinto por tienda — nunca devuelve el producto de
// la otra plataforma. Ver supabase/migrations/20260924_51_productos_iap_plataforma.sql.
export async function obtenerCatalogoGemasIap(plataforma: 'android' | 'ios'): Promise<PaqueteGemasIap[]> {
  const { data, error } = await obtenerClienteSupabase()
    .from('paquetes_gemas_iap_productos')
    .select('paquete_id, product_id_revenuecat, paquete:paquetes_gemas_iap(cantidad_gemas, precio_referencia_usd, activo)')
    .eq('plataforma', plataforma)
    .eq('activo', true);
  if (error) throw error;

  return (data as unknown as FilaProductoIap[])
    .filter((fila) => fila.paquete?.activo)
    .map((fila) => ({
      id: fila.paquete_id,
      productIdRevenueCat: fila.product_id_revenuecat,
      cantidadGemas: Number(fila.paquete!.cantidad_gemas),
      precioReferenciaUsd: fila.paquete!.precio_referencia_usd === null ? null : Number(fila.paquete!.precio_referencia_usd),
    }));
}

type ResultadoCompraRemoto = { articulo_id: string; ya_poseido: boolean; saldo_restante: number };

export async function comprarArticuloTienda(articuloId: string): Promise<ResultadoCompraArticulo> {
  const { data, error } = await obtenerClienteSupabase().rpc('comprar_articulo_tienda', { p_articulo_id: articuloId });
  if (error) throw error;
  const remoto = data as ResultadoCompraRemoto;
  return { articuloId: remoto.articulo_id, yaPoseido: remoto.ya_poseido, saldoRestante: Number(remoto.saldo_restante) };
}

type FilaArbolPaquete = { id: string; nombre: string; master_pack_color: string; rareza: 'legendario' | 'unico'; precio_gemas: number; cantidad_por_compra: number };

export async function obtenerCatalogoArboles(): Promise<ArbolPaquete[]> {
  const { data, error } = await obtenerClienteSupabase()
    .from('arboles_paquetes')
    .select('id, nombre, master_pack_color, rareza, precio_gemas, cantidad_por_compra')
    .eq('activo', true)
    .eq('es_gratuito', false);
  if (error) throw error;
  return (data as FilaArbolPaquete[]).map((fila) => ({ id: fila.id, nombre: fila.nombre, masterPackColor: fila.master_pack_color, rareza: fila.rareza, precioGemas: Number(fila.precio_gemas), cantidadPorCompra: Number(fila.cantidad_por_compra) }));
}

type FilaSemilla = { id: string; paquete_id: string; adquirida_en: string };

export async function obtenerSemillasDisponibles(): Promise<SemillaArbol[]> {
  const { data, error } = await obtenerClienteSupabase().from('usuario_semillas').select('id, paquete_id, adquirida_en').is('habito_id', null);
  if (error) throw error;
  return (data as FilaSemilla[]).map((fila) => ({ id: fila.id, paqueteId: fila.paquete_id, adquiridaEn: fila.adquirida_en }));
}

type ResultadoCompraSemillasRemoto = { paquete_id: string; semillas_compradas: number; saldo_restante: number };

export async function comprarSemillasArbol(paqueteId: string): Promise<ResultadoCompraSemillas> {
  const { data, error } = await obtenerClienteSupabase().rpc('comprar_semillas_arbol', { p_paquete_id: paqueteId });
  if (error) throw error;
  const remoto = data as ResultadoCompraSemillasRemoto;
  return { paqueteId: remoto.paquete_id, semillasCompradas: Number(remoto.semillas_compradas), saldoRestante: Number(remoto.saldo_restante) };
}

export async function asignarSemillaHabito(semillaId: string, habitoId: string): Promise<{ habitoId: string; paqueteId: string }> {
  const { data, error } = await obtenerClienteSupabase().rpc('asignar_semilla_habito', { p_semilla_id: semillaId, p_habito_id: habitoId });
  if (error) throw error;
  const remoto = data as { habito_id: string; paquete_id: string };
  return { habitoId: remoto.habito_id, paqueteId: remoto.paquete_id };
}

// Regalo de bienvenida: exactamente 1 semilla gratis del paquete elegido,
// una sola vez de por vida por cuenta. Ver comercio.otorgar_semilla_bienvenida.
export async function otorgarSemillaBienvenida(paqueteId: string): Promise<{ paqueteId: string }> {
  const { data, error } = await obtenerClienteSupabase().rpc('otorgar_semilla_bienvenida', { p_paquete_id: paqueteId });
  if (error) throw error;
  const remoto = data as { paquete_id: string };
  return { paqueteId: remoto.paquete_id };
}

// Regalo al iniciar el trial de Horizon: 1 semilla más de un árbol legendario
// elegido — exige que el webhook de RevenueCat ya haya marcado el trial como
// iniciado. Ver comercio.otorgar_semilla_trial_horizon.
export async function otorgarSemillaTrialHorizon(paqueteId: string): Promise<{ paqueteId: string }> {
  const { data, error } = await obtenerClienteSupabase().rpc('otorgar_semilla_trial_horizon', { p_paquete_id: paqueteId });
  if (error) throw error;
  const remoto = data as { paquete_id: string };
  return { paqueteId: remoto.paquete_id };
}

export type InfoReferidos = {
  codigo: string;
  totalAmigos: number;
  amigosCompletados: number;
  gemasGanadas: number;
};

export async function obtenerInfoReferidos(): Promise<InfoReferidos> {
  const supabase = obtenerClienteSupabase();
  const { data: rpcData, error: rpcError } = await supabase.rpc('obtener_resumen_referidos');

  if (!rpcError && rpcData) {
    const d = rpcData as { codigo?: string; total_amigos?: number; amigos_completados?: number; gemas_ganadas?: number };
    return {
      codigo: d.codigo ?? '',
      totalAmigos: Number(d.total_amigos ?? 0),
      amigosCompletados: Number(d.amigos_completados ?? 0),
      gemasGanadas: Number(d.gemas_ganadas ?? 0),
    };
  }

  // Fallback: leer perfil directamente
  const { data: usuario } = await supabase.auth.getUser();
  if (!usuario?.user?.id) return { codigo: '', totalAmigos: 0, amigosCompletados: 0, gemasGanadas: 0 };

  const { data: perfil } = await supabase
    .from('perfiles_usuario')
    .select('codigo_referido')
    .eq('id', usuario.user.id)
    .maybeSingle();

  return {
    codigo: (perfil as { codigo_referido?: string } | null)?.codigo_referido ?? '',
    totalAmigos: 0,
    amigosCompletados: 0,
    gemasGanadas: 0,
  };
}


/**
 * Paquetes premium que el usuario ha tenido alguna vez — SIN depender de si aún conserva la semilla: gastarla
 * (plantarla en un hábito) no lo quita. Es lo que desbloquea los temas de color; ver temasDesbloqueados.ts.
 */
export async function obtenerPaquetesDesbloqueados(): Promise<string[]> {
  const { data, error } = await obtenerClienteSupabase().from('usuario_paquetes_desbloqueados').select('paquete_id');
  if (error) throw error;
  return ((data ?? []) as { paquete_id: string }[]).map((fila) => fila.paquete_id);
}
