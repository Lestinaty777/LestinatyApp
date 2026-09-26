import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { ActivityIndicator, Image, Platform, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { Boton, Pantalla, Tarjeta, Texto } from '../../../diseno';
import { comprarPaquete } from '../../../nucleo/compras/revenueCat';
import { obtenerCatalogoGemasIap } from '../gemas.servicio';
import type { PaqueteGemasIap } from '../gemas.tipos';
import { useCatalogoCompras } from '../useCatalogoCompras';
import { CLAVE_SALDO_GEMAS, useSaldoGemas } from '../useSaldoGemas';

export function TiendaPantalla() {
  const { t } = useTranslation();
  const cliente = useQueryClient();
  const { data: saldoGemas } = useSaldoGemas();
  const consultaCatalogo = useQuery({ queryKey: ['tienda', 'catalogoGemasIap', Platform.OS], queryFn: () => obtenerCatalogoGemasIap(Platform.OS === 'ios' ? 'ios' : 'android') });
  const { paquetes: paquetesCompra } = useCatalogoCompras();
  const [comprando, setComprando] = useState<string | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);

  async function comprar(paquete: PaqueteGemasIap) {
    const paqueteCompra = paquetesCompra.find((p) => p.productId === paquete.productIdRevenueCat);
    if (!paqueteCompra) {
      setAviso(t('tienda.gemas.avisoNoDisponible'));
      return;
    }
    setAviso(null);
    setComprando(paquete.id);
    try {
      const resultado = await comprarPaquete(paqueteCompra.id);
      if (resultado.estado === 'completada') {
        setAviso(t('tienda.gemas.avisoExito'));
        cliente.invalidateQueries({ queryKey: CLAVE_SALDO_GEMAS });
        setTimeout(() => cliente.invalidateQueries({ queryKey: CLAVE_SALDO_GEMAS }), 4000);
      } else if (resultado.estado === 'pendiente') {
        setAviso(t('tienda.gemas.avisoPendiente'));
      } else if (resultado.estado === 'error') {
        setAviso(resultado.mensajeSeguro || t('tienda.gemas.avisoError'));
      }
      // 'cancelada' no muestra aviso — el usuario decidió no continuar.
    } catch (err) {
      setAviso(err instanceof Error ? err.message : t('tienda.gemas.avisoError'));
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
        const disponible = paquetesCompra.find((p) => p.productId === paquete.productIdRevenueCat);
        if (!disponible) return null;

        return (
          <Tarjeta key={paquete.id}>
            <Texto variante="subtitulo">{t('tienda.gemas.cantidadGemas', { cantidad: paquete.cantidadGemas })}</Texto>
            <Texto variante="cuerpo">{disponible.precioTexto}</Texto>
            <Boton disabled={comprando === paquete.id} onPress={() => void comprar(paquete)}>
              {comprando === paquete.id ? t('tienda.gemas.comprando') : t('tienda.gemas.comprar')}
            </Boton>
          </Tarjeta>
        );
      })}
    </Pantalla>
  );
}
