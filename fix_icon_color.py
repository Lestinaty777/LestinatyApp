import re

with open('/home/arch-i7/Proyects/app/src/modulos/inicio/pantallas/InicioPantalla.tsx', 'r') as f:
    content = f.read()

# Replace color="#FFFFFF" to color="#24211E" for the navbar icons ONLY
content = content.replace('Icono={() => <PixelIcon name="libro" size={24} color="#FFFFFF" />}', 'Icono={() => <PixelIcon name="libro" size={24} color="#34312E" />}')
content = content.replace('Icono={() => <PixelIcon name="calendario" size={24} color="#FFFFFF" />}', 'Icono={() => <PixelIcon name="calendario" size={24} color="#34312E" />}')
content = content.replace('Icono={() => <PixelIcon name="destellos" size={24} color="#FFFFFF" />}', 'Icono={() => <PixelIcon name="destellos" size={24} color="#34312E" />}')
content = content.replace('Icono={() => <PixelIcon name="tienda" size={24} color="#FFFFFF" />}', 'Icono={() => <PixelIcon name="tienda" size={24} color="#34312E" />}')

with open('/home/arch-i7/Proyects/app/src/modulos/inicio/pantallas/InicioPantalla.tsx', 'w') as f:
    f.write(content)

