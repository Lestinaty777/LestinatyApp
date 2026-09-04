import re

with open('/home/arch-i7/Proyects/app/src/modulos/senderos/componentes/mapa/ContenedorMapaSenderos.tsx', 'r') as f:
    content = f.read()

# Make the padding at the bottom 400 to give plenty of space for the tooltip and overscroll
old_alto = "const altoContenido = Math.max(altura, margenSuperior + Math.max(0, nodos.length - 1) * separacionVertical + 200);"
new_alto = "const altoContenido = Math.max(altura, margenSuperior + Math.max(0, nodos.length - 1) * separacionVertical + 400);"
content = content.replace(old_alto, new_alto)

with open('/home/arch-i7/Proyects/app/src/modulos/senderos/componentes/mapa/ContenedorMapaSenderos.tsx', 'w') as f:
    f.write(content)

