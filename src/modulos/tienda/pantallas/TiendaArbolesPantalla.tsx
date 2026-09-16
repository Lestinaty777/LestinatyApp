import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Pressable, View } from 'react-native';

import { Boton, Pantalla, Tarjeta, Texto } from '../../../diseno';
import { comprarSemillasArbol, obtenerCatalogoArboles, obtenerSemillasDisponibles } from '../gemas.servicio';
import type { ArbolPaquete } from '../gemas.tipos';
import { CLAVE_SALDO_GEMAS, useSaldoGemas } from '../useSaldoGemas';

export const CLAVE_SEMILLAS_DISPONIBLES = ['tienda', 'semillasDisponibles'];

const ETIQUETA_RAREZA: Record<ArbolPaquete['rareza'], string> = {
  legendario: 'Árboles legendarios',
  unico: 'Árboles únicos',
};

export function TiendaArbolesPantalla() {
  const router = useRouter();
  const cliente = useQueryClient();
  const { data: saldoGemas } = useSaldoGemas();
  const consultaCatalogo = useQuery({ queryKey: ['tienda', 'catalogoArboles'], queryFn: obtenerCatalogoArboles });
  useQuery({ queryKey: CLAVE_SEMILLAS_DISPONIBLES, queryFn: obtenerSemillasDisponibles });
  const [comprando, setComprando] = useState<string | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);

  async function comprar(paquete: ArbolPaquete) {
    setAviso(null);
    setComprando(paquete.id);
    try {
      const resultado = await comprarSemillasArbol(paquete.id);
      setAviso(`¡Conseguiste ${resultado.semillasCompradas} semilla${resultado.semillasCompradas === 1 ? '' : 's'} de ${paquete.nombre}!`);
      cliente.invalidateQueries({ queryKey: CLAVE_SALDO_GEMAS });
      cliente.invalidateQueries({ queryKey: CLAVE_SEMILLAS_DISPONIBLES });
    } catch (error) {
      setAviso(error instanceof Error ? error.message : 'No pudimos completar la compra. Inténtalo de nuevo.');
    } finally {
      setComprando(null);
    }
  }

  const paquetesPorRareza = (rareza: ArbolPaquete['rareza']) => consultaCatalogo.data?.filter((paquete) => paquete.rareza === rareza) ?? [];

  return (
    <Pantalla>
      <Texto variante="titulo">Tienda de árboles</Texto>
      <Texto variante="ayuda">Tienes {saldoGemas ?? 0} gemas.</Texto>
      {/* Temporal, solo para revisar arte mientras se cargan paquetes — sacar cuando ya no haga falta. */}
      <Pressable onPress={() => router.push('/vista-paquete')} style={{ marginTop: 8 }}>
        <Texto style={{ color: '#7453B6', textDecorationLine: 'underline' }}>Vista previa de niveles (dev)</Texto>
      </Pressable>

      {aviso && <Tarjeta><Texto variante="cuerpo">{aviso}</Texto></Tarjeta>}

      {consultaCatalogo.isLoading && <ActivityIndicator style={{ marginTop: 24 }} />}

      {(['legendario', 'unico'] as const).map((rareza) => {
        const paquetes = paquetesPorRareza(rareza);
        if (paquetes.length === 0) return null;
        return (
          <View key={rareza} style={{ marginTop: 16 }}>
            <Texto variante="subtitulo">{ETIQUETA_RAREZA[rareza]}</Texto>
            {paquetes.map((paquete) => (
              <Tarjeta key={paquete.id}>
                <View style={{ alignItems: 'center', flexDirection: 'row', gap: 10 }}>
                  <View style={{ backgroundColor: paquete.masterPackColor, borderRadius: 12, height: 24, width: 24 }} />
                  <Texto variante="subtitulo">{paquete.nombre}</Texto>
                </View>
                <Texto variante="cuerpo">
                  {paquete.cantidadPorCompra} semilla{paquete.cantidadPorCompra === 1 ? '' : 's'} · {paquete.precioGemas} gemas
                </Texto>
                <Boton disabled={comprando === paquete.id} onPress={() => void comprar(paquete)}>
                  {comprando === paquete.id ? 'Comprando…' : 'Comprar'}
                </Boton>
              </Tarjeta>
            ))}
          </View>
        );
      })}

      {!consultaCatalogo.isLoading && (consultaCatalogo.data?.length ?? 0) === 0 && (
        <Texto style={{ marginTop: 24 }} variante="ayuda">Todavía no hay árboles a la venta — vuelve pronto.</Texto>
      )}
    </Pantalla>
  );
}
