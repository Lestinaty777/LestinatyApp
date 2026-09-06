import re

with open('/home/arch-i7/Proyects/app/src/modulos/inicio/pantallas/InicioPantalla.tsx', 'r') as f:
    content = f.read()

old_hoy = r"celda\.esHoy && \{ borderColor: '#111111', borderWidth: 2, backgroundColor: celda\.activo \? '#F26D21' : 'rgba\(0,0,0,0\.05\)' \}"
new_hoy = "celda.esHoy && { borderColor: '#111111', borderWidth: 2, backgroundColor: celda.activo ? '#F26D21' : '#FFFFFF' }"

content = re.sub(old_hoy, new_hoy, content)

with open('/home/arch-i7/Proyects/app/src/modulos/inicio/pantallas/InicioPantalla.tsx', 'w') as f:
    f.write(content)
