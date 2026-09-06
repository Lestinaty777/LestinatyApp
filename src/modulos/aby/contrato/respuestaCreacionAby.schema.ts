import { z } from 'zod';

import { pathEstudioSchema } from './pathEstudio.schema';

export const respuestaCreacionAbySchema = z.object({
  path: pathEstudioSchema,
  propuestaId: z.string().uuid(),
});

export type RespuestaCreacionAby = z.infer<typeof respuestaCreacionAbySchema>;

export function validarRespuestaCreacionAby(valor: unknown): RespuestaCreacionAby {
  return respuestaCreacionAbySchema.parse(valor);
}
