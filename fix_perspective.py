import re

# 1. Revert transformOrigin in ContenedorMapaSenderos
with open('/home/arch-i7/Proyects/app/src/modulos/senderos/componentes/mapa/ContenedorMapaSenderos.tsx', 'r') as f:
    content = f.read()

content = content.replace("transformOrigin: 'center top',", "transformOrigin: 'center bottom',")
content = content.replace("const margenSuperior = 20;", "const margenSuperior = 16;")

with open('/home/arch-i7/Proyects/app/src/modulos/senderos/componentes/mapa/ContenedorMapaSenderos.tsx', 'w') as f:
    f.write(content)

# 2. Use translateY instead of negative margin in InicioPantalla
with open('/home/arch-i7/Proyects/app/src/modulos/inicio/pantallas/InicioPantalla.tsx', 'r') as f:
    content2 = f.read()

# Make sure capaMapa has translateY to cover the visual gap of the 3D rotation
content2 = content2.replace('  capaMapa: {\n    flex: 1,\n  },', '  capaMapa: {\n    flex: 1,\n    transform: [{ translateY: -24 }],\n  },')

with open('/home/arch-i7/Proyects/app/src/modulos/inicio/pantallas/InicioPantalla.tsx', 'w') as f:
    f.write(content2)

