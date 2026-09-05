import re

with open('/home/arch-i7/Proyects/app/src/modulos/inicio/pantallas/InicioPantalla.tsx', 'r') as f:
    content = f.read()

# Añadir Math.min para limitar la expansión a 200px (o el valor que decida)
old_math = """const bodyWidth = Math.max(95, 16 + (asig.titulo.length * 8.2) + 10);"""
new_math = """const bodyWidth = Math.min(220, Math.max(95, 16 + (asig.titulo.length * 8.2) + 10));"""

content = content.replace(old_math, new_math)

# Asegurar que eldiccionario de estilos o el contenedor no tenga un flex restrictivo que impida el ellipsize
# Pero ya tiene right: 45 y numberOfLines=1, así que debería truncar automáticamente.

with open('/home/arch-i7/Proyects/app/src/modulos/inicio/pantallas/InicioPantalla.tsx', 'w') as f:
    f.write(content)
