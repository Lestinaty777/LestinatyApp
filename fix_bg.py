import re

with open('/home/arch-i7/Proyects/app/src/modulos/inicio/pantallas/InicioPantalla.tsx', 'r') as f:
    content = f.read()

content = re.sub(r'<Image source=\{biomas\.inicio\.DarkBg\}.*?/>', '', content)
content = content.replace("backgroundColor: '#0F1218',", "backgroundColor: '#EAEAEA',")

with open('/home/arch-i7/Proyects/app/src/modulos/inicio/pantallas/InicioPantalla.tsx', 'w') as f:
    f.write(content)

