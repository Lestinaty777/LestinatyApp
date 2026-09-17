import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Image, View, ScrollView } from 'react-native';
import type { PurchasesPackage } from 'react-native-purchases';

import { Boton, Pantalla, Tarjeta, Texto, PixelartIcon } from '../../../diseno';
import { comprarPaqueteGemas, obtenerPaquetesGemas } from '../../../nucleo/compras/revenueCat';
import { obtenerCatalogoGemasIap } from '../gemas.servicio';
import type { PaqueteGemasIap } from '../gemas.tipos';
import { CLAVE_SALDO_GEMAS, useSaldoGemas } from '../useSaldoGemas';

export function TiendaPantalla() {
  const cliente = useQueryClient();
  const { data: saldoGemas } = useSaldoGemas();
  const consultaCatalogo = useQuery({ queryKey: ['tienda', 'catalogoGemasIap'], queryFn: obtenerCatalogoGemasIap });
  const [paquetesRevenueCat, setPaquetesRevenueCat] = useState<PurchasesPackage[]>([]);
  const [comprando, setComprando] = useState<string | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);

  useEffect(() => {
    let vigente = true;
    void obtenerPaquetesGemas().then((paquetes) => { if (vigente) setPaquetesRevenueCat(paquetes); });
    return () => { vigente = false; };
  }, []);

  async function comprar(paquete: PaqueteGemasIap) {
    const paqueteRevenueCat = paquetesRevenueCat.find((p) => p.product.identifier === paquete.productIdRevenueCat);
    if (!paqueteRevenueCat) {
      setAviso('Este paquete todavía no está disponible para comprar.');
      return;
    }
    setAviso(null);
    setComprando(paquete.id);
    try {
      const resultado = await comprarPaqueteGemas(paqueteRevenueCat);
      if (resultado.exito) {
        setAviso('¡Compra recibida! Tus gemas llegan en unos segundos.');
        cliente.invalidateQueries({ queryKey: CLAVE_SALDO_GEMAS });
        setTimeout(() => cliente.invalidateQueries({ queryKey: CLAVE_SALDO_GEMAS }), 4000);
      }
    } catch {
      setAviso('No pudimos completar la compra. Inténtalo de nuevo.');
    } finally {
      setComprando(null);
    }
  }

  return (
    <Pantalla>
      <View style={{ alignItems: 'center', flexDirection: 'row', gap: 8, marginBottom: 8 }}>
        <Image source={require('../../../../assets/icons/hoy/gemas.png')} style={{ height: 24, resizeMode: 'contain', width: 24 }} />
        <Texto variante="titulo">Comprar gemas</Texto>
      </View>
      <Texto variante="ayuda">Tienes {saldoGemas ?? 0} gemas.</Texto>

      {aviso && <Tarjeta><Texto variante="cuerpo">{aviso}</Texto></Tarjeta>}

      {consultaCatalogo.isLoading && <ActivityIndicator style={{ marginTop: 24 }} />}

      {consultaCatalogo.data?.map((paquete) => {
        const disponible = paquetesRevenueCat.find((p) => p.product.identifier === paquete.productIdRevenueCat);
        const precio = disponible?.product.priceString ?? (paquete.precioReferenciaUsd !== null ? `~$${paquete.precioReferenciaUsd.toFixed(2)} USD` : null);
        return (
          <Tarjeta key={paquete.id}>
            <Texto variante="subtitulo">{paquete.cantidadGemas} gemas</Texto>
            {precio && <Texto variante="cuerpo">{precio}{!disponible ? ' (referencia, aún no disponible)' : ''}</Texto>}
            <Boton disabled={comprando === paquete.id || !disponible} onPress={() => void comprar(paquete)}>
              {comprando === paquete.id ? 'Comprando…' : disponible ? 'Comprar' : 'Próximamente'}
            </Boton>
          </Tarjeta>
        );
      })}
    </Pantalla>
  );
}
