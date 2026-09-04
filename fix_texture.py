import re

with open('/home/arch-i7/Proyects/app/src/modulos/inicio/pantallas/InicioPantalla.tsx', 'r') as f:
    content = f.read()

# Replace the Svg Rect in TexturaPixelArt
content = content.replace('<Rect width="100%" height="100%" fill="url(#dither)" />', '<Rect width="2000" height="2000" fill="url(#dither)" />')

with open('/home/arch-i7/Proyects/app/src/modulos/inicio/pantallas/InicioPantalla.tsx', 'w') as f:
    f.write(content)

