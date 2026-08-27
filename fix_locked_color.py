import re

with open('/home/arch-i7/Proyects/app/src/modulos/senderos/paginas/MapaCompartido.tsx', 'r') as f:
    content = f.read()

# Replace white opacity with a solid distinct grey or black opacity
content = content.replace("'rgba(255,255,255,0.12)'", "'rgba(0, 0, 0, 0.12)'")

with open('/home/arch-i7/Proyects/app/src/modulos/senderos/paginas/MapaCompartido.tsx', 'w') as f:
    f.write(content)
