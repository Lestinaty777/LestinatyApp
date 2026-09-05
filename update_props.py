import re

with open('/home/arch-i7/Proyects/app/src/modulos/senderos/componentes/lecciones/registroLecciones.tsx', 'r') as f:
    content = f.read()

content = content.replace(
    "export type WidgetLeccionProps<T = any> = {\n  paso: PasoLeccion<T>;\n  onCompletado: (exito: boolean) => void;\n};",
    "export type WidgetLeccionProps<T = any> = {\n  paso: PasoLeccion<T>;\n  onCompletado: (exito: boolean) => void;\n  color: string;\n};"
)

with open('/home/arch-i7/Proyects/app/src/modulos/senderos/componentes/lecciones/registroLecciones.tsx', 'w') as f:
    f.write(content)
