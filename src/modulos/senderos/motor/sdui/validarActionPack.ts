import { z } from 'zod';

import { IDS_WIDGET_ACCION, type ActionPack } from './tipos';

const widgetSchema = z.object({
  config: z.record(z.string(), z.unknown()),
  id: z.enum(IDS_WIDGET_ACCION),
  rol: z.enum(['principal', 'apoyo']),
});

const actionPackSchema = z.object({
  nodoId: z.string().min(1),
  version: z.literal(1),
  widgets: z.array(widgetSchema).min(1).max(3).superRefine((widgets, contexto) => {
    if (widgets.filter((widget) => widget.rol === 'principal').length !== 1) {
      contexto.addIssue({ code: 'custom', message: 'Un nodo debe tener exactamente un widget principal.' });
    }
  }),
});

export function validarActionPack(entrada: unknown): ActionPack {
  return actionPackSchema.parse(entrada) as ActionPack;
}
