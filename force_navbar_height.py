import re

with open('/home/arch-i7/Proyects/app/src/modulos/inicio/pantallas/InicioPantalla.tsx', 'r') as f:
    content = f.read()

# Force replace height
content = re.sub(r'height: 62 \+ 140 \* animMenu\.value,', 'height: 62 + 115 * animMenu.value,', content)

# Force replace padding
content = re.sub(r'paddingHorizontal: 20, gap: 15, paddingBottom: 20, paddingTop: 10', 'paddingHorizontal: 20, gap: 15, paddingBottom: 15, paddingTop: 5', content)

with open('/home/arch-i7/Proyects/app/src/modulos/inicio/pantallas/InicioPantalla.tsx', 'w') as f:
    f.write(content)
