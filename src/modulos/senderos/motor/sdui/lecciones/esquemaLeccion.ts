import { z } from 'zod';
import { IDS_WIDGET_LECCION, IDS_WIDGET_LECCION_MVP } from './tiposLeccion';

const configTeoriaCortaSchema = z.object({
  texto: z.string().min(1),
  personaje: z.enum(['explicando', 'celebrando', 'pensando', 'neutro']),
});

const configOpcionMultipleSchema = z.object({
  pregunta: z.string().min(1),
  opciones: z.array(z.string()).min(2).max(6),
  indiceCorrecto: z.number().int().min(0),
  mensajeExito: z.string().optional(),
  mensajeError: z.string().optional(),
});

const configParesConectablesSchema = z.object({
  instruccion: z.string().min(1),
  pares: z.array(z.object({ izquierdo: z.string(), derecho: z.string() })).min(2).max(6),
});

const configRellenarHuecosSchema = z.object({
  textoConHuecos: z.string().min(1),
  opciones: z.array(z.string()).min(1),
  respuestas: z.array(z.string()).min(1),
});

const configVerdaderoFalsoSchema = z.object({
  afirmacion: z.string().min(1),
  esVerdadero: z.boolean(),
  explicacion: z.string().min(1),
});

const configOrdenarListaSchema = z.object({
  instruccion: z.string().min(1),
  elementosDesordenados: z.array(z.string()).min(2),
  elementosOrdenados: z.array(z.string()).min(2),
});

const configFlashcardSchema = z.object({
  frente: z.string().min(1),
  dorso: z.string().min(1),
});

const configParejasMemoriaSchema = z.object({
  pares: z.array(z.object({ id: z.string(), textoA: z.string(), textoB: z.string() })).min(2).max(8),
});

const configOpcionImagenSchema = z.object({
  pregunta: z.string().min(1),
  opciones: z.array(z.object({ url: z.string().url(), descripcion: z.string() })).min(2).max(4),
  indiceCorrecto: z.number().int().min(0),
});

const configDesafioFinalSchema = z.object({
  preguntas: z.array(configOpcionMultipleSchema).min(3),
  tiempoLimiteSegundos: z.number().int().min(10).max(300),
});

const pasoLeccionSchema = z.discriminatedUnion('tipo', [
  z.object({ id: z.string(), tipo: z.literal('teoria-corta'), config: configTeoriaCortaSchema }),
  z.object({ id: z.string(), tipo: z.literal('opcion-multiple'), config: configOpcionMultipleSchema }),
  z.object({ id: z.string(), tipo: z.literal('pares-conectables'), config: configParesConectablesSchema }),
  z.object({ id: z.string(), tipo: z.literal('rellenar-huecos'), config: configRellenarHuecosSchema }),
  z.object({ id: z.string(), tipo: z.literal('verdadero-falso'), config: configVerdaderoFalsoSchema }),
  z.object({ id: z.string(), tipo: z.literal('ordenar-lista'), config: configOrdenarListaSchema }),
  z.object({ id: z.string(), tipo: z.literal('flashcard'), config: configFlashcardSchema }),
  z.object({ id: z.string(), tipo: z.literal('parejas-memoria'), config: configParejasMemoriaSchema }),
  z.object({ id: z.string(), tipo: z.literal('opcion-imagen'), config: configOpcionImagenSchema }),
  z.object({ id: z.string(), tipo: z.literal('desafio-final'), config: configDesafioFinalSchema }),
]);

export const leccionPackSchema = z.object({
  id: z.string(),
  titulo: z.string().min(1),
  pasos: z.array(pasoLeccionSchema).min(1).max(15),
});

export const leccionPackMvpSchema = leccionPackSchema.superRefine((leccion, contexto) => {
  for (const paso of leccion.pasos) {
    if (!IDS_WIDGET_LECCION_MVP.includes(paso.tipo as typeof IDS_WIDGET_LECCION_MVP[number])) {
      contexto.addIssue({
        code: 'custom',
        message: `El widget ${paso.tipo} no esta disponible en el MVP.`,
        path: ['pasos'],
      });
    }
  }
});

export function validarLeccionPack(data: unknown) {
  return leccionPackSchema.parse(data);
}
