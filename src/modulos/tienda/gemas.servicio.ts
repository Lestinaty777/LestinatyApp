import { obtenerClienteSupabase } from '../../servicios/base-datos/supabase';
import type { ArticuloTienda, CompraTienda, PaqueteGemasIap, ResultadoCompraArticulo } from './gemas.tipos';

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

type FilaPaqueteIap = { id: string; product_id_revenuecat: string; cantidad_gemas: number; precio_referencia_usd: number | null };

export async function obtenerCatalogoGemasIap(): Promise<PaqueteGemasIap[]> {
  const { data, error } = await obtenerClienteSupabase().from('paquetes_gemas_iap').select('id, product_id_revenuecat, cantidad_gemas, precio_referencia_usd').eq('activo', true);
  if (error) throw error;
  return (data as FilaPaqueteIap[]).map((fila) => ({ id: fila.id, productIdRevenueCat: fila.product_id_revenuecat, cantidadGemas: Number(fila.cantidad_gemas), precioReferenciaUsd: fila.precio_referencia_usd === null ? null : Number(fila.precio_referencia_usd) }));
}

type ResultadoCompraRemoto = { articulo_id: string; ya_poseido: boolean; saldo_restante: number };

export async function comprarArticuloTienda(articuloId: string): Promise<ResultadoCompraArticulo> {
  const { data, error } = await obtenerClienteSupabase().rpc('comprar_articulo_tienda', { p_articulo_id: articuloId });
  if (error) throw error;
  const remoto = data as ResultadoCompraRemoto;
  return { articuloId: remoto.articulo_id, yaPoseido: remoto.ya_poseido, saldoRestante: Number(remoto.saldo_restante) };
}
