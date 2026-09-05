import re

# 1. Remove negative margin in InicioPantalla
with open('/home/arch-i7/Proyects/app/src/modulos/inicio/pantallas/InicioPantalla.tsx', 'r') as f:
    content = f.read()

content = content.replace('  capaMapa: {\n    flex: 1,\n    marginTop: -10,\n  },', '  capaMapa: {\n    flex: 1,\n  },')

with open('/home/arch-i7/Proyects/app/src/modulos/inicio/pantallas/InicioPantalla.tsx', 'w') as f:
    f.write(content)

# 2. Change transformOrigin in ContenedorMapaSenderos
with open('/home/arch-i7/Proyects/app/src/modulos/senderos/componentes/mapa/ContenedorMapaSenderos.tsx', 'r') as f:
    content2 = f.read()

content2 = content2.replace("transformOrigin: 'center bottom',", "transformOrigin: 'center top',")
# We also need to restore a small top margin inside the map so the node isn't literally touching the top edge inside the 3D space
content2 = content2.replace("const margenSuperior = 16;", "const margenSuperior = 20;")

with open('/home/arch-i7/Proyects/app/src/modulos/senderos/componentes/mapa/ContenedorMapaSenderos.tsx', 'w') as f:
    f.write(content2)

