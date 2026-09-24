import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Image, View } from 'react-native';
import type { PurchasesPackage } from 'react-native-purchases';
import { useTranslation } from 'react-i18next';

import { Boton, Pantalla, Tarjeta, Texto } from '../../../diseno';
import { comprarPaqueteGemas, obtenerPaquetesGemas } from '../../../nucleo/compras/revenueCat';
import { obtenerCatalogoGemasIap } from '../gemas.servicio';
import type { PaqueteGemasIap } from '../gemas.tipos';
import { CLAVE_SALDO_GEMAS, useSaldoGemas } from '../useSaldoGemas';

export function TiendaPantalla() {
  const { t } = useTranslation();
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
      setAviso(t('tienda.gemas.avisoNoDisponible'));
      return;
    }
    setAviso(null);
    setComprando(paquete.id);
    try {
      const resultado = await comprarPaqueteGemas(paqueteRevenueCat);
      if (resultado.exito) {
        setAviso(t('tienda.gemas.avisoExito'));
        cliente.invalidateQueries({ queryKey: CLAVE_SALDO_GEMAS });
        setTimeout(() => cliente.invalidateQueries({ queryKey: CLAVE_SALDO_GEMAS }), 4000);
      }
    } catch {
      setAviso(t('tienda.gemas.avisoError'));
    } finally {
      setComprando(null);
    }
  }

  return (
    <Pantalla>
      <View style={{ alignItems: 'center', flexDirection: 'row', gap: 8, marginBottom: 8 }}>
        <Image source={require('../../../../assets/icons/hoy/gemas.png')} style={{ height: 24, resizeMode: 'contain', width: 24 }} />
        <Texto variante="titulo">{t('tienda.gemas.titulo')}</Texto>
      </View>
      <Texto variante="ayuda">{t('tienda.gemas.saldoGemas', { saldo: saldoGemas ?? 0 })}</Texto>

      {aviso && <Tarjeta><Texto variante="cuerpo">{aviso}</Texto></Tarjeta>}

      {consultaCatalogo.isLoading && <ActivityIndicator style={{ marginTop: 24 }} />}

      {consultaCatalogo.data?.map((paquete) => {
        const disponible = paquetesRevenueCat.find((p) => p.product.identifier === paquete.productIdRevenueCat);
        if (!disponible) return null;

        const precio = disponible.product.priceString;
        return (
          <Tarjeta key={paquete.id}>
            <Texto variante="subtitulo">{t('tienda.gemas.cantidadGemas', { cantidad: paquete.cantidadGemas })}</Texto>
            <Texto variante="cuerpo">{precio}</Texto>
            <Boton disabled={comprando === paquete.id} onPress={() => void comprar(paquete)}>
              {comprando === paquete.id ? t('tienda.gemas.comprando') : t('tienda.gemas.comprar')}
            </Boton>
          </Tarjeta>
        );
      })}
    </Pantalla>
  );
}
