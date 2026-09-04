import { z } from 'zod';

import { IDS_WIDGET_ACCION, type ActionPack } from '../../senderos/motor/sdui/tipos';
import { validarActionPack } from '../../senderos/motor/sdui/validarActionPack';
import { INTENCIONES_ESTUDIO_ABY, type IntencionEstudioAbyId } from '../datos/intencionesEstudioAby';

export const CATEGORIAS_ABY = ['rutinas', 'salud', 'tareas', 'habitos', 'relaciones', 'finanzas', 'estudio'] as const;
export type CategoriaAbyId = typeof CATEGORIAS_ABY[number];
export type PreguntaIdAby = 'fecha-examen' | 'alcance' | 'fuente' | 'disponibilidad-semanal' | 'nivel-inicial';
export type PoseAby = 'saludando' | 'pensando' | 'celebrando';

export type ConfiguracionEstudioAby = {
  alcance: string;
  disponibilidadSemanal: '2' | '4' | '6' | '8' | null;
  fechaExamen: string | null;
  fuente: string;
  intencion: IntencionEstudioAbyId | null;
  nivelInicial: 'inicio' | 'basico' | 'intermedio' | null;
  objetivo: string;
};

export type ConfiguracionConversacionAby = ConfiguracionEstudioAby;

export type MensajeAby = {
  id: string;
  texto: string;
  autor: 'aby' | 'usuario';
};

export type PreguntaVisualAby = {
  id: PreguntaIdAby;
  opciones: readonly { etiqueta: string; valor: string }[];
  placeholder?: string;
  tipo: 'cards' | 'chips' | 'texto';
  titulo: string;
};

export type NodoPropuestaAby = {
  actionPack: ActionPack;
  descripcion: string;
  id: string;
  titulo: string;
};

export type PropuestaSenderoAby = {
  categoriaId: CategoriaAbyId;
  configuracion: ConfiguracionConversacionAby;
  descripcion: string;
  nodos: readonly NodoPropuestaAby[];
  subcategoriaId: string;
  titulo: string;
};

export type RespuestaAgentePreguntaAby = {
  mensaje: string;
  pregunta: PreguntaVisualAby;
  propuesta?: undefined;
  tipo: 'pregunta';
};

export type RespuestaAgentePropuestaAby = {
  mensaje: string;
  pregunta?: undefined;
  propuesta: PropuestaSenderoAby;
  tipo: 'propuesta';
};

export type RespuestaAgenteAby = RespuestaAgentePreguntaAby | RespuestaAgentePropuestaAby | {
  mensaje: string;
  pregunta?: undefined;
  propuesta?: undefined;
  tipo: 'mensaje' | 'resumen';
};

export const configuracionEstudioAbySchema = z.object({
  alcance: z.string().trim().max(500),
  disponibilidadSemanal: z.enum(['2', '4', '6', '8']).nullable(),
  fechaExamen: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable(),
  fuente: z.string().trim().max(500),
  intencion: z.enum(INTENCIONES_ESTUDIO_ABY).nullable(),
  nivelInicial: z.enum(['inicio', 'basico', 'intermedio']).nullable(),
  objetivo: z.string().trim().min(1).max(240),
});

export const configuracionConversacionAbySchema = configuracionEstudioAbySchema;

export const preguntaVisualAbySchema = z.object({
  id: z.enum(['fecha-examen', 'alcance', 'fuente', 'disponibilidad-semanal', 'nivel-inicial']),
  opciones: z.array(z.object({
    etiqueta: z.string().trim().min(1).max(80),
    valor: z.string().trim().min(1).max(80),
  })).max(8),
  placeholder: z.string().trim().min(1).max(120).optional(),
  tipo: z.enum(['cards', 'chips', 'texto']),
  titulo: z.string().trim().min(1).max(120),
});

const actionPackSchema = z.object({
  nodoId: z.string().min(1),
  version: z.literal(1),
  widgets: z.array(z.object({
    config: z.record(z.string(), z.unknown()),
    id: z.enum(IDS_WIDGET_ACCION),
    rol: z.enum(['principal', 'apoyo']),
  })).min(1).max(3),
}).superRefine((pack, contexto) => {
  try {
    validarActionPack(pack);
  } catch (error) {
    contexto.addIssue({
      code: 'custom',
      message: error instanceof Error ? error.message : 'ActionPack invalido.',
    });
  }
});

export const propuestaSenderoAbySchema = z.object({
  categoriaId: z.enum(CATEGORIAS_ABY),
  configuracion: configuracionConversacionAbySchema,
  descripcion: z.string().trim().min(1).max(360),
  nodos: z.array(z.object({
    actionPack: actionPackSchema,
    descripcion: z.string().trim().min(1).max(360),
    id: z.string().min(1),
    titulo: z.string().trim().min(1).max(80),
  })).min(3).max(5),
  subcategoriaId: z.string().trim().min(1).max(80),
  titulo: z.string().trim().min(1).max(80),
});

export const respuestaAgenteAbySchema = z.discriminatedUnion('tipo', [
  z.object({ mensaje: z.string().trim().min(1).max(500), pregunta: preguntaVisualAbySchema, tipo: z.literal('pregunta') }),
  z.object({ mensaje: z.string().trim().min(1).max(500), propuesta: propuestaSenderoAbySchema, tipo: z.literal('propuesta') }),
  z.object({ mensaje: z.string().trim().min(1).max(500), tipo: z.literal('mensaje') }),
  z.object({ mensaje: z.string().trim().min(1).max(500), tipo: z.literal('resumen') }),
]);

export function validarPropuestaSenderoAby(valor: unknown): PropuestaSenderoAby {
  return propuestaSenderoAbySchema.parse(valor) as PropuestaSenderoAby;
}

export function validarRespuestaAby(valor: unknown): RespuestaAgenteAby {
  return respuestaAgenteAbySchema.parse(valor) as RespuestaAgenteAby;
}
