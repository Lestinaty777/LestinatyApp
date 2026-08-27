import { useLocalSearchParams } from 'expo-router';

import { Pantalla, Tarjeta, Texto } from '../../../diseno';

export function DetalleSenderoPantalla() {
  const { id } = useLocalSearchParams<{ id: string }>();

  return (
    <Pantalla>
      <Texto variante="titulo">Detalle de sendero</Texto>
      <Tarjeta>
        <Texto variante="subtitulo">Sendero {id}</Texto>
        <Texto variante="cuerpo">Aqui viviran mapa, distancia, desnivel, clima y favoritos.</Texto>
      </Tarjeta>
    </Pantalla>
  );
}
