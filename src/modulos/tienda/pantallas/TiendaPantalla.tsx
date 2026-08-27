import { Link } from 'expo-router';

import { Boton, Pantalla, Tarjeta, Texto } from '../../../diseno';

export function TiendaPantalla() {
  return (
    <Pantalla>
      <Texto variante="titulo">Tienda</Texto>
      <Texto variante="ayuda">Productos, suscripciones y compras gestionadas con RevenueCat.</Texto>

      <Tarjeta>
        <Texto variante="subtitulo">Plan explorador</Texto>
        <Texto variante="cuerpo">Acceso a funciones premium de rutas y metas.</Texto>
        <Link href="/tienda/producto/plan-explorador" asChild>
          <Boton variante="secundario">Ver producto</Boton>
        </Link>
      </Tarjeta>
    </Pantalla>
  );
}
