import re

with open('/home/arch-i7/Proyects/app/src/modulos/senderos/componentes/mapa/ContenedorMapaSenderos.tsx', 'r') as f:
    content = f.read()

# Modify altoContenido to include 200px of extra space
old_alto = "const altoContenido = Math.max(altura, margenSuperior + margenInferior + Math.max(0, nodos.length - 1) * separacionVertical + 88);"
new_alto = "const altoContenido = Math.max(altura, margenSuperior + Math.max(0, nodos.length - 1) * separacionVertical + 200);"
content = content.replace(old_alto, new_alto)

# Ensure ScrollView has scrollEnabled=true regardless of enfocado (though it was already true when enfocado)
# Let's just make it always scrollEnabled={true} to be safe if that's what the user meant.
old_scroll = "scrollEnabled={enfocado}"
new_scroll = "scrollEnabled={true}"
content = content.replace(old_scroll, new_scroll)

with open('/home/arch-i7/Proyects/app/src/modulos/senderos/componentes/mapa/ContenedorMapaSenderos.tsx', 'w') as f:
    f.write(content)

