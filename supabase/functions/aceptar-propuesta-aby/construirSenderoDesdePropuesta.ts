type Identificador = { id: string };

export type PathEstudioPersistible = {
  conexiones: readonly { destinoId: string; origenId: string }[];
  descripcion: string;
  intencion: 'aprender' | 'examen';
  nodos: readonly {
    descripcion: string;
    id: string;
    lessonPack: { id: string; pasos: readonly unknown[]; titulo: string };
    objetivo: string;
    tiempoEstimadoMinutos: number;
    tipo: 'leccion' | 'evaluacion';
    titulo: string;
  }[];
  titulo: string;
};

export type NodoPersistible = {
  criterioAprobado: Record<string, unknown>;
  descripcion: string;
  lessonPack: PathEstudioPersistible['nodos'][number]['lessonPack'];
  nivelId: string;
  objetivo: string;
  orden: number;
  pathId: string;
  tiempoEstimadoMinutos: number;
  tipo: 'leccion' | 'evaluacion';
  titulo: string;
};

export type RepositorioConstruccionSendero = {
  aceptarPropuesta(input: { propuestaId: string }): Promise<void>;
  activarNivel(input: { nivelId: string }): Promise<void>;
  activarSendero(input: { senderoId: string }): Promise<void>;
  crearCofre(input: { gemas: number; nivelId: string; nodoEvaluacionId: string }): Promise<void>;
  crearConexiones(input: { conexiones: readonly { destinoId: string; origenId: string }[]; senderoId: string }): Promise<void>;
  crearMeta(input: { descripcion: string; titulo: string; usuarioId: string }): Promise<Identificador>;
  crearNivel(input: { numero: number; senderoId: string; titulo: string }): Promise<Identificador>;
  crearNodos(nodos: readonly NodoPersistible[]): Promise<Record<string, string>>;
  crearSendero(input: { descripcion: string; metaId: string; titulo: string }): Promise<Identificador>;
  eliminarMeta(input: { metaId: string }): Promise<void>;
  marcarPropuestaFallida(input: { errorCodigo: string; propuestaId: string }): Promise<void>;
};

export type PropuestaParaConstruir = {
  path: PathEstudioPersistible;
  propuestaId: string;
  usuarioId: string;
};

export async function construirSenderoDesdePropuesta(
  repositorio: RepositorioConstruccionSendero,
  propuesta: PropuestaParaConstruir,
) {
  const operaciones: string[] = [];
  let metaId: string | null = null;

  try {
    const meta = await repositorio.crearMeta({
      descripcion: propuesta.path.descripcion,
      titulo: propuesta.path.titulo,
      usuarioId: propuesta.usuarioId,
    });
    metaId = meta.id;
    operaciones.push('meta');

    const sendero = await repositorio.crearSendero({
      descripcion: propuesta.path.descripcion,
      metaId,
      titulo: propuesta.path.titulo,
    });
    operaciones.push('sendero');

    const nivel = await repositorio.crearNivel({ numero: 1, senderoId: sendero.id, titulo: propuesta.path.titulo });
    operaciones.push('seccion');

    const idsNodos = await repositorio.crearNodos(propuesta.path.nodos.map((nodo, indice) => ({
      criterioAprobado: { tipo: nodo.tipo, version: 1 },
      descripcion: nodo.descripcion,
      lessonPack: nodo.lessonPack,
      nivelId: nivel.id,
      objetivo: nodo.objetivo,
      orden: indice + 1,
      pathId: nodo.id,
      tiempoEstimadoMinutos: nodo.tiempoEstimadoMinutos,
      tipo: nodo.tipo,
      titulo: nodo.titulo,
    })));
    operaciones.push('nodos');

    const conexiones = propuesta.path.conexiones.map((conexion) => ({
      destinoId: idsNodos[conexion.destinoId],
      origenId: idsNodos[conexion.origenId],
    }));
    if (conexiones.some((conexion) => !conexion.origenId || !conexion.destinoId)) {
      throw new Error('No se pudieron resolver los nodos de la propuesta.');
    }
    await repositorio.crearConexiones({ conexiones, senderoId: sendero.id });
    operaciones.push('conexiones');

    const evaluacion = propuesta.path.nodos.at(-1);
    const nodoEvaluacionId = evaluacion ? idsNodos[evaluacion.id] : undefined;
    if (!nodoEvaluacionId) throw new Error('No se encontro la evaluacion final.');
    await repositorio.crearCofre({ gemas: 10, nivelId: nivel.id, nodoEvaluacionId });
    operaciones.push('cofre');

    await repositorio.activarNivel({ nivelId: nivel.id });
    operaciones.push('activar-seccion');
    await repositorio.activarSendero({ senderoId: sendero.id });
    operaciones.push('activar-sendero');
    await repositorio.aceptarPropuesta({ propuestaId: propuesta.propuestaId });
    operaciones.push('aceptar-propuesta');

    return { operaciones, senderoId: sendero.id };
  } catch (error) {
    if (metaId) await repositorio.eliminarMeta({ metaId }).catch(() => undefined);
    await repositorio.marcarPropuestaFallida({ errorCodigo: 'construccion', propuestaId: propuesta.propuestaId }).catch(() => undefined);
    throw error;
  }
}
