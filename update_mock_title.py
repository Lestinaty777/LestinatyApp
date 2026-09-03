import re

with open('/home/arch-i7/Proyects/app/src/modulos/senderos/paginas/analisis/rutinas/RutinasAnalisis.tsx', 'r') as f:
    rcode = f.read()

rcode = rcode.replace("config: { meta: 10, unidad: 'Vasos' }", "config: { titulo: 'Mantente Hidratado', subtitulo: 'Bebe agua durante el día', meta: 10, unidad: 'Vasos' }")

with open('/home/arch-i7/Proyects/app/src/modulos/senderos/paginas/analisis/rutinas/RutinasAnalisis.tsx', 'w') as f:
    f.write(rcode)

with open('/home/arch-i7/Proyects/app/src/modulos/senderos/motor/sdui/registroAcciones.ts', 'r') as f:
    acode = f.read()

acode = acode.replace("z.object({ meta: z.number(), unidad: z.string() })", "z.object({ meta: z.number(), unidad: z.string(), titulo: z.string().optional(), subtitulo: z.string().optional() })")

with open('/home/arch-i7/Proyects/app/src/modulos/senderos/motor/sdui/registroAcciones.ts', 'w') as f:
    f.write(acode)

