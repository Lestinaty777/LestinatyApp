import { describe, expect, it } from 'vitest';

import { construirPlanDesdePropuesta, type DiaPersistible, type RepositorioConstruccionPlan } from './construirPlanDesdePropuesta';

const diasDeEjemplo: DiaPersistible[] = [
  {
    bloques: [
      { items: ['Instalar herramientas', 'Crear el repo'], mensajeContexto: 'Arrancá con calma.', momento: 'manana' },
      { items: ['Leer la documentación'], mensajeContexto: 'Sin apuro.', momento: 'tarde' },
    ],
  },
  {
    bloques: [{ items: ['Primer commit'], mensajeContexto: 'Un paso chico cuenta.', momento: 'manana' }],
    titulo: 'Día 2',
  },
];

function crearRepositorioFalso(): RepositorioConstruccionPlan & { operaciones: string[] } {
  let contadorDias = 0;
  let contadorBloques = 0;
  const operaciones: string[] = [];
  return {
    operaciones,
    aceptarPropuesta: async () => { operaciones.push('aceptar-propuesta'); },
    crearBloque: async () => { contadorBloques += 1; operaciones.push('crear-bloque'); return { id: `bloque-${contadorBloques}` }; },
    crearDia: async () => { contadorDias += 1; operaciones.push('crear-dia'); return { id: `dia-${contadorDias}` }; },
    crearInstancia: async () => { operaciones.push('crear-instancia'); return { id: 'instancia-1' }; },
    crearItems: async (items) => { operaciones.push(`crear-items:${items.length}`); },
    crearPlan: async () => { operaciones.push('crear-plan'); return { id: 'plan-1' }; },
    crearSeccion: async (input) => { operaciones.push(`crear-seccion:${input.estado}`); return { id: `seccion-${input.orden}` }; },
    eliminarDiasDeSeccion: async () => { operaciones.push('eliminar-dias'); },
    eliminarPlan: async () => { operaciones.push('eliminar-plan'); },
    marcarPropuestaFallida: async () => { operaciones.push('marcar-fallida'); },
    marcarSeccionDetallada: async () => { operaciones.push('marcar-detallada'); },
  };
}

describe('construirPlanDesdePropuesta — plan_inicial', () => {
  it('crea el plan, su instancia, todas las secciones (solo la primera con días) y acepta la propuesta', async () => {
    const repositorio = crearRepositorioFalso();
    const resultado = await construirPlanDesdePropuesta(repositorio, {
      bloquesPorDia: 2,
      descripcion: 'Armar una app en 30 días.',
      objetivoOriginal: 'Quiero crear una app en 30 días.',
      primeraSeccionDias: diasDeEjemplo,
      propuestaId: 'propuesta-1',
      secciones: [
        { resumen: 'Preparar el terreno.', titulo: 'Semana 1: Planificación' },
        { resumen: 'Construir lo central.', titulo: 'Semana 2: Desarrollo' },
        { resumen: 'Dejarlo listo.', titulo: 'Semana 3: Pulido' },
      ],
      tipo: 'plan_inicial',
      titulo: 'Crear una app',
      usuarioId: 'usuario-1',
    });

    expect(resultado).toEqual({ planId: 'plan-1' });
    expect(repositorio.operaciones).toEqual([
      'crear-plan',
      'crear-instancia',
      'crear-seccion:detallada',
      'crear-dia', 'crear-bloque', 'crear-items:2', 'crear-bloque', 'crear-items:1',
      'crear-dia', 'crear-bloque', 'crear-items:1',
      'crear-seccion:solo_titulo',
      'crear-seccion:solo_titulo',
      'aceptar-propuesta',
    ]);
  });

  it('si falla a mitad de camino, borra el plan y marca la propuesta fallida sin tragarse el error', async () => {
    const repositorio = crearRepositorioFalso();
    repositorio.crearSeccion = async () => { throw new Error('boom'); };

    await expect(construirPlanDesdePropuesta(repositorio, {
      bloquesPorDia: 1,
      descripcion: 'd',
      objetivoOriginal: 'o',
      primeraSeccionDias: [],
      propuestaId: 'propuesta-2',
      secciones: [{ resumen: 'r', titulo: 't' }, { resumen: 'r2', titulo: 't2' }],
      tipo: 'plan_inicial',
      titulo: 'Plan',
      usuarioId: 'usuario-1',
    })).rejects.toThrow('boom');

    expect(repositorio.operaciones).toEqual(['crear-plan', 'crear-instancia', 'eliminar-plan', 'marcar-fallida']);
  });
});

describe('construirPlanDesdePropuesta — seccion', () => {
  it('crea los días/bloques/ítems de la sección, la marca detallada y acepta la propuesta', async () => {
    const repositorio = crearRepositorioFalso();
    const resultado = await construirPlanDesdePropuesta(repositorio, {
      dias: diasDeEjemplo,
      propuestaId: 'propuesta-3',
      seccionId: 'seccion-existente',
      tipo: 'seccion',
      usuarioId: 'usuario-1',
    });

    expect(resultado).toEqual({ seccionId: 'seccion-existente' });
    expect(repositorio.operaciones).toEqual([
      'crear-dia', 'crear-bloque', 'crear-items:2', 'crear-bloque', 'crear-items:1',
      'crear-dia', 'crear-bloque', 'crear-items:1',
      'marcar-detallada',
      'aceptar-propuesta',
    ]);
  });

  it('si falla, borra los días creados hasta ahora y marca la propuesta fallida', async () => {
    const repositorio = crearRepositorioFalso();
    repositorio.marcarSeccionDetallada = async () => { throw new Error('boom'); };

    await expect(construirPlanDesdePropuesta(repositorio, {
      dias: diasDeEjemplo,
      propuestaId: 'propuesta-4',
      seccionId: 'seccion-existente',
      tipo: 'seccion',
      usuarioId: 'usuario-1',
    })).rejects.toThrow('boom');

    expect(repositorio.operaciones.at(-2)).toBe('eliminar-dias');
    expect(repositorio.operaciones.at(-1)).toBe('marcar-fallida');
  });
});
