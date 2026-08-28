import re

with open('/home/arch-i7/Proyects/app/src/modulos/senderos/paginas/AnalisisSenderos.tsx', 'r') as f:
    acode = f.read()

# 1. Update Sendero Type
if "meta?: string;" not in acode:
    acode = acode.replace("senderos: { etiqueta: string; progreso: number; titulo: string }[];", "senderos: { etiqueta: string; progreso: number; titulo: string; meta?: string }[];")

# 2. Add Metas to Salud senderos
old_salud_senderos = "senderos: [{ etiqueta: '20 min', progreso: 81, titulo: 'Caminar 20 min' }, { etiqueta: '10 min', progreso: 54, titulo: 'Meditacion diaria' }, { etiqueta: '7 noches', progreso: 46, titulo: 'Mejor sueno' }]"
new_salud_senderos = "senderos: [{ etiqueta: '20 min', progreso: 81, titulo: 'Caminar 20 min', meta: 'fisico' }, { etiqueta: '10 min', progreso: 54, titulo: 'Meditacion diaria', meta: 'sueno' }, { etiqueta: '7 noches', progreso: 46, titulo: 'Mejor sueno', meta: 'sueno' }]"
acode = acode.replace(old_salud_senderos, new_salud_senderos)

# 3. Add Metas to Rutinas senderos
old_rutinas_senderos = "senderos: [{ etiqueta: '4 bloques', progreso: 68, titulo: 'Rutina de brazo' }, { etiqueta: '15 min', progreso: 42, titulo: 'Cierre del dia' }, { etiqueta: '2 bloques', progreso: 74, titulo: 'Bloque de enfoque' }]"
new_rutinas_senderos = "senderos: [{ etiqueta: '4 bloques', progreso: 68, titulo: 'Rutina de brazo', meta: 'diaria' }, { etiqueta: '15 min', progreso: 42, titulo: 'Cierre del dia', meta: 'diaria' }, { etiqueta: '2 bloques', progreso: 74, titulo: 'Bloque de enfoque', meta: 'diaria' }]"
acode = acode.replace(old_rutinas_senderos, new_rutinas_senderos)

# 4. Change senderoFiltro state to hold object
old_state = "const [senderoFiltro, setSenderoFiltro] = useState<string | null>(null);"
new_state = "const [senderoFiltro, setSenderoFiltro] = useState<{ titulo: string; meta?: string } | null>(null);"
acode = acode.replace(old_state, new_state)

# 5. Update senderoFiltro usage in pills
acode = acode.replace("const activo = senderoFiltro === sendero.titulo;", "const activo = senderoFiltro?.titulo === sendero.titulo;")
acode = acode.replace("setSenderoFiltro(sendero.titulo);", "setSenderoFiltro(sendero);")

# 6. Update passing props (they might throw TS error if RutinasAnalisis expects string)
# I will update RutinasAnalisis/SaludAnalisis to expect the object or string.

with open('/home/arch-i7/Proyects/app/src/modulos/senderos/paginas/AnalisisSenderos.tsx', 'w') as f:
    f.write(acode)

# Fix types in RutinasAnalisis
with open('/home/arch-i7/Proyects/app/src/modulos/senderos/paginas/analisis/rutinas/RutinasAnalisis.tsx', 'r') as f:
    rcode = f.read()
rcode = rcode.replace("senderoFiltro?: string | null;", "senderoFiltro?: { titulo: string; meta?: string } | null;")
with open('/home/arch-i7/Proyects/app/src/modulos/senderos/paginas/analisis/rutinas/RutinasAnalisis.tsx', 'w') as f:
    f.write(rcode)

# Fix types in SaludAnalisis
with open('/home/arch-i7/Proyects/app/src/modulos/senderos/paginas/analisis/salud/SaludAnalisis.tsx', 'r') as f:
    scode = f.read()
scode = scode.replace("senderoFiltro?: string | null;", "senderoFiltro?: { titulo: string; meta?: string } | null;")
with open('/home/arch-i7/Proyects/app/src/modulos/senderos/paginas/analisis/salud/SaludAnalisis.tsx', 'w') as f:
    f.write(scode)

