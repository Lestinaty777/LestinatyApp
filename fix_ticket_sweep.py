import re

with open('/home/arch-i7/Proyects/app/src/modulos/inicio/pantallas/InicioPantalla.tsx', 'r') as f:
    content = f.read()

# Revert the sweep-flag strictly back to 0
old_path = "const path = `M 0,0 L 95,0 A 8,8 0 0,1 111,0 L ${w},0 L ${w},${h} L 111,${h} A 8,8 0 0,1 95,${h} L 0,${h} Z`;"
new_path = "const path = `M 0,0 L 95,0 A 8,8 0 0,0 111,0 L ${w},0 L ${w},${h} L 111,${h} A 8,8 0 0,0 95,${h} L 0,${h} Z`;"

content = content.replace(old_path, new_path)

with open('/home/arch-i7/Proyects/app/src/modulos/inicio/pantallas/InicioPantalla.tsx', 'w') as f:
    f.write(content)
