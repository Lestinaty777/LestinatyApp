type Identificador = { id: string };

export type MomentoBloque = 'manana' | 'noche' | 'tarde';

export type BloquePersistible = {
  items: readonly string[];
  mensajeContexto: string;
  momento: MomentoBloque;
};

export type DiaPersistible = {
  bloques: readonly BloquePersistible[];
  titulo?: string;
};

export type PropuestaParaConstruir =
  | {
    bloquesPorDia: number;
    descripcion: string;
    objetivoOriginal: string;
    primeraSeccionDias: readonly DiaPersistible[];
    propuestaId: string;
    secciones: readonly { resumen: string; titulo: string }[];
    tipo: 'plan_inicial';
    titulo: string;
    usuarioId: string;
  }
  | {
    dias: readonly DiaPersistible[];
    propuestaId: string;
    seccionId: string;
    tipo: 'seccion';
    usuarioId: string;
  };

export type RepositorioConstruccionPlan = {
  aceptarPropuesta(input: { propuestaId: string }): Promise<void>;
  crearBloque(input: { diaId: string; mensajeContexto: string; momento: MomentoBloque }): Promise<Identificador>;
  crearDia(input: { orden: number; seccionId: string; titulo?: string }): Promise<Identificador>;
  crearInstancia(input: { esCreador: boolean; planId: string; usuarioId: string }): Promise<Identificador>;
  crearItems(items: readonly { bloqueId: string; orden: number; titulo: string }[]): Promise<void>;
  crearPlan(input: { bloquesPorDia: number; descripcion: string; objetivoOriginal: string; titulo: string; usuarioId: string }): Promise<Identificador>;
  crearSeccion(input: { estado: 'detallada' | 'solo_titulo'; orden: number; planId: string; resumen: string; titulo: string }): Promise<Identificador>;
  eliminarDiasDeSeccion(input: { seccionId: string }): Promise<void>;
  eliminarPlan(input: { planId: string }): Promise<void>;
  marcarPropuestaFallida(input: { errorCodigo: string; propuestaId: string }): Promise<void>;
  marcarSeccionDetallada(input: { seccionId: string }): Promise<void>;
};

async function construirDiasDeSeccion(repositorio: RepositorioConstruccionPlan, seccionId: string, dias: readonly DiaPersistible[]) {
  for (const [indiceDia, dia] of dias.entries()) {
    const diaCreado = await repositorio.crearDia({ orden: indiceDia, seccionId, titulo: dia.titulo });
    for (const bloque of dia.bloques) {
      const bloqueCreado = await repositorio.crearBloque({ diaId: diaCreado.id, mensajeContexto: bloque.mensajeContexto, momento: bloque.momento });
      await repositorio.crearItems(bloque.items.map((titulo, indiceItem) => ({ bloqueId: bloqueCreado.id, orden: indiceItem, titulo })));
    }
  }
}

// Dos formas, un solo lugar: 'plan_inicial' crea el plan+instancia+todas las
// secciones (solo la primera con días reales, el resto solo título/resumen
// — ver la decisión de "generación progresiva"); 'seccion' solo llena de
// días/bloques/ítems una sección YA EXISTENTE que estaba en 'solo_titulo'.
export async function construirPlanDesdePropuesta(repositorio: RepositorioConstruccionPlan, propuesta: PropuestaParaConstruir) {
  if (propuesta.tipo === 'plan_inicial') {
    let planId: string | null = null;
    try {
      const plan = await repositorio.crearPlan({
        bloquesPorDia: propuesta.bloquesPorDia,
        descripcion: propuesta.descripcion,
        objetivoOriginal: propuesta.objetivoOriginal,
        titulo: propuesta.titulo,
        usuarioId: propuesta.usuarioId,
      });
      planId = plan.id;

      await repositorio.crearInstancia({ esCreador: true, planId, usuarioId: propuesta.usuarioId });

      for (const [indice, seccion] of propuesta.secciones.entries()) {
        const esPrimera = indice === 0;
        const seccionCreada = await repositorio.crearSeccion({
          estado: esPrimera ? 'detallada' : 'solo_titulo',
          orden: indice,
          planId,
          resumen: seccion.resumen,
          titulo: seccion.titulo,
        });
        if (esPrimera) await construirDiasDeSeccion(repositorio, seccionCreada.id, propuesta.primeraSeccionDias);
      }

      await repositorio.aceptarPropuesta({ propuestaId: propuesta.propuestaId });
      return { planId };
    } catch (error) {
      if (planId) await repositorio.eliminarPlan({ planId }).catch(() => undefined);
      await repositorio.marcarPropuestaFallida({ errorCodigo: 'construccion', propuestaId: propuesta.propuestaId }).catch(() => undefined);
      throw error;
    }
  }

  try {
    await construirDiasDeSeccion(repositorio, propuesta.seccionId, propuesta.dias);
    await repositorio.marcarSeccionDetallada({ seccionId: propuesta.seccionId });
    await repositorio.aceptarPropuesta({ propuestaId: propuesta.propuestaId });
    return { seccionId: propuesta.seccionId };
  } catch (error) {
    await repositorio.eliminarDiasDeSeccion({ seccionId: propuesta.seccionId }).catch(() => undefined);
    await repositorio.marcarPropuestaFallida({ errorCodigo: 'construccion', propuestaId: propuesta.propuestaId }).catch(() => undefined);
    throw error;
  }
}
