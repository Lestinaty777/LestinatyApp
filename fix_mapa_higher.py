import re

with open('/home/arch-i7/Proyects/app/src/modulos/senderos/componentes/mapa/ContenedorMapaSenderos.tsx', 'r') as f:
    content = f.read()

# Replace the top coordinates
content = content.replace("top: -150, left: -50, width: 280, height: 280", "top: -240, left: -50, width: 280, height: 280")
content = content.replace("top: -120, right: -80, width: 320, height: 320", "top: -210, right: -80, width: 320, height: 320")

with open('/home/arch-i7/Proyects/app/src/modulos/senderos/componentes/mapa/ContenedorMapaSenderos.tsx', 'w') as f:
    f.write(content)
