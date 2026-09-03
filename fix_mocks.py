import re
with open('/home/arch-i7/Proyects/app/src/modulos/senderos/paginas/analisis/rutinas/RutinasAnalisis.tsx', 'r') as f:
    rcode = f.read()

# Fix Registro config
rcode = re.sub(r'const mockRegistro: WidgetAccionPack = \{.*?\}', "const mockRegistro: WidgetAccionPack = { id: 'registro', rol: 'principal', config: { titulo: 'Peso Corporal', subtitulo: 'Registra tu peso matutino', placeholder: '0.0', tipoEntrada: 'numero', unidad: 'kg', min: 40, max: 150 } }", rcode)

# Fix Checklist config
rcode = re.sub(r'const mockChecklist: WidgetAccionPack = \{.*?\}', "const mockChecklist: WidgetAccionPack = { id: 'checklist-asistida', rol: 'principal', config: { titulo: 'Rutina de Mañana', subtitulo: 'Completa los 3 pasos clave', tareas: [{id: '1', texto: 'Hacer la cama'}, {id: '2', texto: 'Meditar'}, {id: '3', texto: 'Escribir metas'}] } }", rcode)

with open('/home/arch-i7/Proyects/app/src/modulos/senderos/paginas/analisis/rutinas/RutinasAnalisis.tsx', 'w') as f:
    f.write(rcode)

