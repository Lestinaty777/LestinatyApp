import re

with open('/home/arch-i7/Proyects/app/src/modulos/inicio/pantallas/InicioPantalla.tsx', 'r') as f:
    content = f.read()

# Delete the empty View that adds space
content = content.replace('<View style={{ height: 24 }} />', '')

# Apply negative margin to capaMapa if needed
content = content.replace('  capaMapa: {\n    flex: 1,\n  },', '  capaMapa: {\n    flex: 1,\n    marginTop: -10,\n  },')

with open('/home/arch-i7/Proyects/app/src/modulos/inicio/pantallas/InicioPantalla.tsx', 'w') as f:
    f.write(content)

