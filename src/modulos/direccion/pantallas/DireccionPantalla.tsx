import { Boton, Pantalla, Tarjeta, Texto } from '../../../diseno';

export function DireccionPantalla() {
  return (
    <Pantalla>
      <Texto variante="titulo">Direccion</Texto>
      <Texto variante="ayuda">Direcciones guardadas, ubicaciones y preferencias de entrega.</Texto>

      <Tarjeta>
        <Texto variante="subtitulo">Sin direccion principal</Texto>
        <Texto variante="cuerpo">Agrega una direccion para compras y rutas cercanas.</Texto>
        <Boton variante="secundario">Agregar direccion</Boton>
      </Tarjeta>
    </Pantalla>
  );
}
