import { Link, useLocalSearchParams } from 'expo-router';

import { Boton, Pantalla, Tarjeta, Texto } from '../../../diseno';

export function ProductoPantalla() {
  const { id } = useLocalSearchParams<{ id: string }>();

  return (
    <Pantalla>
      <Texto variante="titulo">Producto</Texto>
      <Tarjeta>
        <Texto variante="subtitulo">{id}</Texto>
        <Texto variante="cuerpo">Detalle, beneficios, precio y estado de suscripcion.</Texto>
        <Link href="/tienda/pago" asChild>
          <Boton>Ir a pago</Boton>
        </Link>
      </Tarjeta>
    </Pantalla>
  );
}
