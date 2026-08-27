import { Pantalla, Tarjeta, Texto } from '../../../diseno';

export function PagoPantalla() {
  return (
    <Pantalla>
      <Texto variante="titulo">Pago</Texto>
      <Tarjeta>
        <Texto variante="subtitulo">Checkout</Texto>
        <Texto variante="cuerpo">Aqui se conectara RevenueCat para iOS, Android y web.</Texto>
      </Tarjeta>
    </Pantalla>
  );
}
