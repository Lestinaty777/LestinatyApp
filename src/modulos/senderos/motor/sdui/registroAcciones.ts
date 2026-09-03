import type { DefinicionWidgetAccion, WidgetAccionId } from './tipos';

import { z } from 'zod';
import { WidgetContador } from './widgets/WidgetContador';
import { WidgetRegistro } from './widgets/WidgetRegistro';
import { WidgetCronometro } from './widgets/WidgetCronometro';
import { WidgetChecklist } from './widgets/WidgetChecklist';
import { WidgetEscala } from './widgets/WidgetEscala';
import { WidgetDecision } from './widgets/WidgetDecision';
import { WidgetKanban } from './widgets/WidgetKanban';
import { WidgetFoco } from './widgets/WidgetFoco';


// This registry is intentionally static. Add a widget here after its component and schema exist.

export const REGISTRO_ACCIONES: Partial<Record<WidgetAccionId, DefinicionWidgetAccion>> = {
  'contador': {
    Componente: WidgetContador as any,
    descripcion: 'Contador de incrementos con meta',
    esquemaConfig: z.object({ meta: z.number(), unidad: z.string(), titulo: z.string().optional(), subtitulo: z.string().optional() })
  },
  'registro': {
    Componente: WidgetRegistro as any,
    descripcion: 'Input manual de datos',
    esquemaConfig: z.object({ tipoEntrada: z.enum(['numero', 'texto']), placeholder: z.string(), unidad: z.string().optional() })
  },

  'checklist-asistida': {
    Componente: WidgetChecklist as any,
    descripcion: 'Lista de tareas con limite (max 3)',
    esquemaConfig: z.object({ 
      tareas: z.array(z.object({ id: z.string(), texto: z.string() })).max(3) 
    })
  },





  'foco': {
    Componente: WidgetFoco as any,
    descripcion: 'Modo enfoque profundo (Pomodoro)',
    esquemaConfig: z.object({ 
      duracionMinutos: z.number(), titulo: z.string().optional(), subtitulo: z.string().optional()
    })
  },
  'kanban': {
    Componente: WidgetKanban as any,
    descripcion: 'Mini tablero Kanban de 3 columnas',
    esquemaConfig: z.object({ 
      tareas: z.array(z.string()).max(3), titulo: z.string().optional(), subtitulo: z.string().optional()
    })
  },
  'escala': {
    Componente: WidgetEscala as any,
    descripcion: 'Escala numerica o valoracion',
    esquemaConfig: z.object({ 
      min: z.number(), max: z.number(), etiquetas: z.tuple([z.string(), z.string()]).optional(), titulo: z.string().optional(), subtitulo: z.string().optional()
    })
  },
  'decision': {
    Componente: WidgetDecision as any,
    descripcion: 'Bifurcacion de 2 opciones',
    esquemaConfig: z.object({ 
      opciones: z.tuple([z.string(), z.string()]), titulo: z.string().optional(), subtitulo: z.string().optional()
    })
  },
  'cronometro': {
    Componente: WidgetCronometro as any,
    descripcion: 'Temporizador regresivo',
    esquemaConfig: z.object({ duracionSegundos: z.number(), titulo: z.string().optional(), subtitulo: z.string().optional() })
  }
};


export function obtenerWidgetAccion(id: WidgetAccionId) {
  return REGISTRO_ACCIONES[id] ?? null;
}
