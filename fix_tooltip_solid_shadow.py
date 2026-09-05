import re

with open('/home/arch-i7/Proyects/app/src/modulos/senderos/componentes/mapa/ContenedorMapaSenderos.tsx', 'r') as f:
    content = f.read()

# Replace the shadow color
old_shadow = "{ position: 'absolute', top: 6, left: 0, right: 0, bottom: -6, backgroundColor: 'rgba(0,0,0,0.3)', shadowColor: 'transparent' }"
new_shadow = "{ position: 'absolute', top: 6, left: 0, right: 0, bottom: -6, backgroundColor: oscurecer(color, 0.9), shadowColor: 'transparent' }"
content = content.replace(old_shadow, new_shadow)

# Remove the soft drop shadow from tooltipCaja since we have a solid extrusion now
content = re.sub(r'    shadowColor: \'#000\',\n    shadowOffset: \{ width: 0, height: 8 \},\n    shadowOpacity: 0.3,\n    shadowRadius: 16,\n', '', content)

with open('/home/arch-i7/Proyects/app/src/modulos/senderos/componentes/mapa/ContenedorMapaSenderos.tsx', 'w') as f:
    f.write(content)
