import { z } from 'zod';

import { obtenerClienteSupabase } from '../../../servicios/base-datos/supabase';
import type { MensajeAby, RespuestaAgenteAby } from '../contrato/aby.contrato';
import { configuracionConversacionAbySchema, validarRespuestaAby } from '../contrato/aby.contrato';
import type { RespuestaAceptacionAby } from '../contrato/respuestaAceptacionAby.schema';
import { validarRespuestaAceptacionAby } from '../contrato/respuestaAceptacionAby.schema';
import type { RespuestaCreacionAby } from '../contrato/respuestaCreacionAby.schema';
import { validarRespuestaCreacionAby } from '../contrato/respuestaCreacionAby.schema';

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

export async function generarPropuestaEstudioRemota(solicitud: SolicitudGeminiAby): Promise<RespuestaCreacionAby> {
  const payload = solicitudSchema.parse(solicitud);
  if (payload.configuracion.intencion !== 'examen' && payload.configuracion.intencion !== 'materia') {
    throw new Error('El MVP solo permite aprender algo o preparar un examen.');
  }

  const cliente = obtenerClienteSupabase();
  const { data, error } = await cliente.functions.invoke('generar-sendero-aby', { body: payload });
  if (error) throw new Error('Aby no pudo crear tu propuesta. Intentalo de nuevo.');
  return validarRespuestaCreacionAby(data);
}

export { validarRespuestaCreacionAby };

export async function aceptarPropuestaAby(propuestaId: string): Promise<RespuestaAceptacionAby> {
  const id = z.string().uuid().parse(propuestaId);
  const { data, error } = await obtenerClienteSupabase().functions.invoke('aceptar-propuesta-aby', {
    body: { propuestaId: id },
  });
  if (error) throw new Error('No pudimos crear tu sendero. Intentalo de nuevo.');
  return validarRespuestaAceptacionAby(data);
}

export function solicitudAby(configuracion: SolicitudGeminiAby['configuracion'], historial: MensajeAby[]): SolicitudGeminiAby {
  return solicitudSchema.parse({ configuracion, historial: historial.slice(-12) });
}
