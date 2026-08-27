import { useLocalSearchParams } from 'expo-router';

import { Pantalla, Tarjeta, Texto } from '../../../diseno';

export function DetalleMetaPantalla() {
  const { id } = useLocalSearchParams<{ id: string }>();

  return (
    <Pantalla>
      <Texto variante="titulo">Detalle de meta</Texto>
      <Tarjeta>
        <Texto variante="subtitulo">Meta {id}</Texto>
        <Texto variante="cuerpo">Aqui viviran progreso, historial y acciones de la meta.</Texto>
      </Tarjeta>
    </Pantalla>
  );
}
