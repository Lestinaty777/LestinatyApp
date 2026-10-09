type Identificador = { id: string };

export type MomentoBloque = 'manana' | 'noche' | 'tarde';

export type TipoItemPlan = 'contador' | 'cronometro' | 'simple';

export type ItemPersistible = {
  metaValor?: number;
  tipo: TipoItemPlan;
  titulo: string;
  unidad?: string;
};

export type BloquePersistible = {
  items: readonly ItemPersistible[];
  mensajeContexto: string;
  momento: MomentoBloque;
};

export type DiaPersistible = {
  bloques: readonly BloquePersistible[];
  titulo?: string;
};

export type RamaPersistible = { nombre: string; resumen: string };

export type PropuestaParaConstruir =
  | {
    descripcion: string;
    disponibilidad: Record<string, number | string>;
    objetivoOriginal: string;
    // Exactamente una de las dos: "ramas" (recien se pide dividir el plan,
    // sin detalle todavia) o secciones+primeraSeccionDias (modo de siempre).
    primeraSeccionDias?: readonly DiaPersistible[];
    propuestaId: string;
    ramas?: readonly RamaPersistible[];
    secciones?: readonly { resumen: string; titulo: string }[];
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
  }
  | {
    // Reclamar una rama ya existente de un plan ya existente: la "crea" de
    // verdad (nombre/resumen ya la tenia desde que el plan se armo) — recien
    // ahora se le asigna una instancia + su disponibilidad real, y se le
    // arma el primer tramo de secciones/dias, igual que 'plan_inicial'.
    descripcionRama?: string;
    disponibilidad: Record<string, number | string>;
    planId: string;
    primeraSeccionDias: readonly DiaPersistible[];
    propuestaId: string;
    ramaId: string;
    secciones: readonly { resumen: string; titulo: string }[];
    tipo: 'rama';
    usuarioId: string;
  };

export type RepositorioConstruccionPlan = {
  aceptarPropuesta(input: { propuestaId: string }): Promise<void>;
  crearBloque(input: { diaId: string; mensajeContexto: string; momento: MomentoBloque }): Promise<Identificador>;
  crearDia(input: { orden: number; seccionId: string; titulo?: string }): Promise<Identificador>;
  crearInstancia(input: { esCreador: boolean; planId: string; usuarioId: string }): Promise<Identificador>;
  crearItems(items: readonly { bloqueId: string; metaValor?: number; orden: number; tipo: TipoItemPlan; titulo: string; unidad?: string }[]): Promise<void>;
  crearPlan(input: { descripcion: string; disponibilidad: Record<string, number | string>; objetivoOriginal: string; titulo: string; usuarioId: string }): Promise<Identificador>;
  crearRama(input: { nombre: string; orden: number; planId: string; resumen: string }): Promise<Identificador>;
  crearSeccion(input: { estado: 'detallada' | 'solo_titulo'; orden: number; planId: string; ramaId?: string; resumen: string; titulo: string }): Promise<Identificador>;
  eliminarDiasDeSeccion(input: { seccionId: string }): Promise<void>;
  eliminarPlan(input: { planId: string }): Promise<void>;
  eliminarSeccionesDeRama(input: { ramaId: string }): Promise<void>;
  liberarRama(input: { ramaId: string }): Promise<void>;
  marcarPropuestaFallida(input: { errorCodigo: string; propuestaId: string }): Promise<void>;
  marcarSeccionDetallada(input: { seccionId: string }): Promise<void>;
  // Atomico: falla si la rama ya tiene instancia, o si el usuario no tiene
  // una instancia en ese plan — nunca confiar en el cliente para esto.
  reclamarRama(input: { disponibilidad: Record<string, number | string>; planId: string; ramaId: string; resumen?: string; usuarioId: string }): Promise<Identificador>;
};

async function construirDiasDeSeccion(repositorio: RepositorioConstruccionPlan, seccionId: string, dias: readonly DiaPersistible[]) {
  for (const [indiceDia, dia] of dias.entries()) {
    const diaCreado = await repositorio.crearDia({ orden: indiceDia, seccionId, titulo: dia.titulo });
    for (const bloque of dia.bloques) {
      const bloqueCreado = await repositorio.crearBloque({ diaId: diaCreado.id, mensajeContexto: bloque.mensajeContexto, momento: bloque.momento });
      await repositorio.crearItems(bloque.items.map((item, indiceItem) => ({ bloqueId: bloqueCreado.id, metaValor: item.metaValor, orden: indiceItem, tipo: item.tipo, titulo: item.titulo, unidad: item.unidad })));
    }
  }
}

// Tres formas, un solo lugar:
//   'plan_inicial' crea el plan+instancia, y o bien TODAS las secciones
//   (solo la primera con dias reales, el resto solo titulo/resumen — ver la
//   decision de "generacion progresiva"), o bien (si se pidieron ramas) solo
//   las N ramas SIN NADA mas adentro — nadie las reclamo todavia.
//   'seccion' llena de dias/bloques/items una seccion YA EXISTENTE que
//   estaba en 'solo_titulo'.
//   'rama' reclama una rama YA EXISTENTE (le asigna la instancia de quien la
//   pidio + su disponibilidad real) y le arma su propio primer tramo de
//   secciones, igual que 'plan_inicial' pero dentro de un plan que ya existe.
export async function construirPlanDesdePropuesta(repositorio: RepositorioConstruccionPlan, propuesta: PropuestaParaConstruir) {
  if (propuesta.tipo === 'plan_inicial') {
    let planId: string | null = null;
    try {
      const plan = await repositorio.crearPlan({
        descripcion: propuesta.descripcion,
        disponibilidad: propuesta.disponibilidad,
        objetivoOriginal: propuesta.objetivoOriginal,
        titulo: propuesta.titulo,
        usuarioId: propuesta.usuarioId,
      });
      planId = plan.id;

      await repositorio.crearInstancia({ esCreador: true, planId, usuarioId: propuesta.usuarioId });

      if (propuesta.ramas) {
        for (const [indice, rama] of propuesta.ramas.entries()) {
          await repositorio.crearRama({ nombre: rama.nombre, orden: indice, planId, resumen: rama.resumen });
        }
      } else if (propuesta.secciones && propuesta.primeraSeccionDias) {
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
      }

      await repositorio.aceptarPropuesta({ propuestaId: propuesta.propuestaId });
      return { planId };
    } catch (error) {
      if (planId) await repositorio.eliminarPlan({ planId }).catch(() => undefined);
      await repositorio.marcarPropuestaFallida({ errorCodigo: 'construccion', propuestaId: propuesta.propuestaId }).catch(() => undefined);
      throw error;
    }
  }

  if (propuesta.tipo === 'rama') {
    let reclamada = false;
    try {
      await repositorio.reclamarRama({
        disponibilidad: propuesta.disponibilidad,
        planId: propuesta.planId,
        ramaId: propuesta.ramaId,
        resumen: propuesta.descripcionRama,
        usuarioId: propuesta.usuarioId,
      });
      reclamada = true;

      for (const [indice, seccion] of propuesta.secciones.entries()) {
        const esPrimera = indice === 0;
        const seccionCreada = await repositorio.crearSeccion({
          estado: esPrimera ? 'detallada' : 'solo_titulo',
          orden: indice,
          planId: propuesta.planId,
          ramaId: propuesta.ramaId,
          resumen: seccion.resumen,
          titulo: seccion.titulo,
        });
        if (esPrimera) await construirDiasDeSeccion(repositorio, seccionCreada.id, propuesta.primeraSeccionDias);
      }

      await repositorio.aceptarPropuesta({ propuestaId: propuesta.propuestaId });
      return { ramaId: propuesta.ramaId };
    } catch (error) {
      if (reclamada) {
        await repositorio.eliminarSeccionesDeRama({ ramaId: propuesta.ramaId }).catch(() => undefined);
        await repositorio.liberarRama({ ramaId: propuesta.ramaId }).catch(() => undefined);
      }
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
