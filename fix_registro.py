import re

with open('/home/arch-i7/Proyects/app/src/modulos/senderos/algoritmo/registroBiomas.ts', 'r') as f:
    content = f.read()

# I will add a new asset to each category with id 'base'
bases = {
  'rutinas': 'base-rutinas.png',
  'salud': 'base-salud.png',
  'tareas': 'base-tareas.png',
  'habitos': 'base-habitos.png',
  'relaciones': 'base-relaciones.png',
  'finanzas': 'base-finanzas.png',
  'estudio': 'base-estudio.png',
}

for cat, filename in bases.items():
    pattern = r"(" + cat + r": \{\n\s+assets: \[)"
    replacement = r"\1{ id: 'base', fuente: require('../../../../assets/ilustraciones/senderos/biomas/arboles/" + filename + r"'), nombre: 'Base " + cat.capitalize() + r"' }, "
    content = re.sub(pattern, replacement, content)

with open('/home/arch-i7/Proyects/app/src/modulos/senderos/algoritmo/registroBiomas.ts', 'w') as f:
    f.write(content)
