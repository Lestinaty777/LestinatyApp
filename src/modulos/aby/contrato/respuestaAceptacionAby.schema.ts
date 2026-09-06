import { z } from 'zod';

export const respuestaAceptacionAbySchema = z.object({
  senderoId: z.string().uuid(),
});

export type RespuestaAceptacionAby = z.infer<typeof respuestaAceptacionAbySchema>;

export function validarRespuestaAceptacionAby(valor: unknown): RespuestaAceptacionAby {
  return respuestaAceptacionAbySchema.parse(valor);
}
