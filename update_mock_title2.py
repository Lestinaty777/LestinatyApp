import re

with open('/home/arch-i7/Proyects/app/src/modulos/senderos/paginas/analisis/rutinas/RutinasAnalisis.tsx', 'r') as f:
    rcode = f.read()

rcode = rcode.replace("config: { duracionSegundos: 15 }", "config: { titulo: 'Lectura Profunda', subtitulo: 'Modo enfoque activado', duracionSegundos: 15 }")

with open('/home/arch-i7/Proyects/app/src/modulos/senderos/paginas/analisis/rutinas/RutinasAnalisis.tsx', 'w') as f:
    f.write(rcode)

with open('/home/arch-i7/Proyects/app/src/modulos/senderos/motor/sdui/registroAcciones.ts', 'r') as f:
    acode = f.read()

acode = acode.replace("z.object({ duracionSegundos: z.number() })", "z.object({ duracionSegundos: z.number(), titulo: z.string().optional(), subtitulo: z.string().optional() })")

with open('/home/arch-i7/Proyects/app/src/modulos/senderos/motor/sdui/registroAcciones.ts', 'w') as f:
    f.write(acode)

