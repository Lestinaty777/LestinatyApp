import re

with open('/home/arch-i7/Proyects/app/src/modulos/senderos/motor/sdui/registroAcciones.ts', 'r') as f:
    acode = f.read()

new_imports = """
import { z } from 'zod';
import { WidgetContador } from './widgets/WidgetContador';
import { WidgetRegistro } from './widgets/WidgetRegistro';
import { WidgetCronometro } from './widgets/WidgetCronometro';
"""

if "WidgetContador" not in acode:
    acode = acode.replace("import type { DefinicionWidgetAccion, WidgetAccionId } from './tipos';", "import type { DefinicionWidgetAccion, WidgetAccionId } from './tipos';\n" + new_imports)
    
    registry = """
export const REGISTRO_ACCIONES: Partial<Record<WidgetAccionId, DefinicionWidgetAccion>> = {
  'contador': {
    Componente: WidgetContador as any,
    descripcion: 'Contador de incrementos con meta',
    esquemaConfig: z.object({ meta: z.number(), unidad: z.string() })
  },
  'registro': {
    Componente: WidgetRegistro as any,
    descripcion: 'Input manual de datos',
    esquemaConfig: z.object({ tipoEntrada: z.enum(['numero', 'texto']), placeholder: z.string(), unidad: z.string().optional() })
  },
  'cronometro': {
    Componente: WidgetCronometro as any,
    descripcion: 'Temporizador regresivo',
    esquemaConfig: z.object({ duracionSegundos: z.number() })
  }
};
"""
    acode = re.sub(r"export const REGISTRO_ACCIONES.*?;", registry, acode, flags=re.DOTALL)
    
    with open('/home/arch-i7/Proyects/app/src/modulos/senderos/motor/sdui/registroAcciones.ts', 'w') as f:
        f.write(acode)

