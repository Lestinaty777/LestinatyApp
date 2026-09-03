import { z } from 'zod';

import { obtenerClienteSupabase } from '../../../servicios/base-datos/supabase';
import type { MensajeAby, RespuestaAgenteAby } from '../contrato/aby.contrato';
import { configuracionConversacionAbySchema, validarRespuestaAby } from '../contrato/aby.contrato';

const solicitudSchema = z.object({
  configuracion: configuracionConversacionAbySchema,
  historial: z.array(z.object({ autor: z.enum(['aby', 'usuario']), id: z.string().max(80), texto: z.string().max(500) })).max(12),
});

export type SolicitudGeminiAby = z.infer<typeof solicitudSchema>;

export async function generarTurnoAbyRemoto(solicitud: SolicitudGeminiAby): Promise<RespuestaAgenteAby> {
  const payload = solicitudSchema.parse(solicitud);
  const cliente = obtenerClienteSupabase();
  const { data, error } = await cliente.functions.invoke('generar-sendero-aby', { body: payload });
  if (error) throw new Error('Aby no pudo responder. Intentalo de nuevo.');
  return validarRespuestaAby(data);
}

export const generarRespuestaAbyRemota = generarTurnoAbyRemoto;

export function solicitudAby(configuracion: SolicitudGeminiAby['configuracion'], historial: MensajeAby[]): SolicitudGeminiAby {
  return solicitudSchema.parse({ configuracion, historial: historial.slice(-12) });
}
