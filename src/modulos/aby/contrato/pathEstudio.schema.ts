import { z } from 'zod';

import { leccionPackMvpSchema } from '../../senderos/motor/sdui/lecciones/esquemaLeccion';

const nodoPathEstudioSchema = z.object({
  descripcion: z.string().trim().min(1).max(600),
  id: z.string().regex(/^[a-z0-9-]+$/),
  lessonPack: leccionPackMvpSchema,
  objetivo: z.string().trim().min(1).max(300),
  tiempoEstimadoMinutos: z.number().int().min(1).max(180),
  tipo: z.enum(['leccion', 'evaluacion']),
  titulo: z.string().trim().min(1).max(120),
});

const conexionPathEstudioSchema = z.object({
  destinoId: z.string().regex(/^[a-z0-9-]+$/),
  origenId: z.string().regex(/^[a-z0-9-]+$/),
});

export const pathEstudioSchema = z.object({
  conexiones: z.array(conexionPathEstudioSchema).length(5),
  descripcion: z.string().trim().min(1).max(600),
  intencion: z.enum(['aprender', 'examen']),
  nodos: z.array(nodoPathEstudioSchema).length(6),
  titulo: z.string().trim().min(1).max(120),
}).superRefine((path, contexto) => {
  const lecciones = path.nodos.filter((nodo) => nodo.tipo === 'leccion');
  const evaluaciones = path.nodos.filter((nodo) => nodo.tipo === 'evaluacion');
  const examenFinal = path.nodos.at(-1);

  if (lecciones.length !== 5 || evaluaciones.length !== 1 || examenFinal?.tipo !== 'evaluacion') {
    contexto.addIssue({
      code: 'custom',
      message: 'El camino requiere cinco lecciones y una evaluacion final.',
      path: ['nodos'],
    });
  }

  const idsUnicos = new Set(path.nodos.map((nodo) => nodo.id));
  if (idsUnicos.size !== path.nodos.length) {
    contexto.addIssue({ code: 'custom', message: 'Los nodos deben tener ids unicos.', path: ['nodos'] });
  }

  const conexionesEsperadas = path.nodos.slice(0, -1).map((nodo, indice) => ({
    destinoId: path.nodos[indice + 1]?.id,
    origenId: nodo.id,
  }));
  const conexionesLineales = path.conexiones.every((conexion, indice) =>
    conexion.origenId === conexionesEsperadas[indice]?.origenId
      && conexion.destinoId === conexionesEsperadas[indice]?.destinoId,
  );

  if (!conexionesLineales) {
    contexto.addIssue({
      code: 'custom',
      message: 'Las conexiones deben ser lineales y respetar el orden de los nodos.',
      path: ['conexiones'],
    });
  }
});

export type PathEstudio = z.infer<typeof pathEstudioSchema>;
export type NodoPathEstudio = PathEstudio['nodos'][number];

export function validarPathEstudio(valor: unknown): PathEstudio {
  return pathEstudioSchema.parse(valor);
}
