import { Link } from 'expo-router';

import { Boton, Pantalla, Tarjeta, Texto } from '../../../diseno';

export function MetasPantalla() {
  return (
    <Pantalla>
      <Texto variante="titulo">Metas</Texto>
      <Texto variante="ayuda">Objetivos personales, progreso y recordatorios.</Texto>

      <Tarjeta>
        <Texto variante="subtitulo">Caminar 20 km esta semana</Texto>
        <Texto variante="cuerpo">Progreso inicial de ejemplo.</Texto>
        <Link href="/metas/demo" asChild>
          <Boton variante="secundario">Abrir meta</Boton>
        </Link>
      </Tarjeta>
    </Pantalla>
  );
}
