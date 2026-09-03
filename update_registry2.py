import re

with open('/home/arch-i7/Proyects/app/src/modulos/senderos/motor/sdui/registroAcciones.ts', 'r') as f:
    acode = f.read()

if "WidgetChecklist" not in acode:
    acode = acode.replace("import { WidgetCronometro } from './widgets/WidgetCronometro';", "import { WidgetCronometro } from './widgets/WidgetCronometro';\nimport { WidgetChecklist } from './widgets/WidgetChecklist';")
    
    nuevo_item = """
  'checklist-asistida': {
    Componente: WidgetChecklist as any,
    descripcion: 'Lista de tareas con limite (max 3)',
    esquemaConfig: z.object({ 
      tareas: z.array(z.object({ id: z.string(), texto: z.string() })).max(3) 
    })
  },
"""
    acode = acode.replace("  'cronometro': {", nuevo_item + "  'cronometro': {")
    
    with open('/home/arch-i7/Proyects/app/src/modulos/senderos/motor/sdui/registroAcciones.ts', 'w') as f:
        f.write(acode)

