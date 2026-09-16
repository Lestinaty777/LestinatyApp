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
