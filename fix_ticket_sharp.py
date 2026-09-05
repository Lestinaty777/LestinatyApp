import re

with open('/home/arch-i7/Proyects/app/src/modulos/inicio/pantallas/InicioPantalla.tsx', 'r') as f:
    content = f.read()

# Revert corners back to sharp but keep the inward (1) cutouts
old_path = "const path = `M 6,0 L 95,0 A 8,8 0 0,1 111,0 L ${w-6},0 A 6,6 0 0,1 ${w},6 L ${w},${h-6} A 6,6 0 0,1 ${w-6},${h} L 111,${h} A 8,8 0 0,1 95,${h} L 6,${h} A 6,6 0 0,1 0,${h-6} L 0,6 A 6,6 0 0,1 6,0 Z`;"
new_path = "const path = `M 0,0 L 95,0 A 8,8 0 0,1 111,0 L ${w},0 L ${w},${h} L 111,${h} A 8,8 0 0,1 95,${h} L 0,${h} Z`;"

content = content.replace(old_path, new_path)

# Remove the border radius from the texture mask
old_mask = "<View style={{ position: 'absolute', left: 0, top: 0, width: 103, height: h, overflow: 'hidden', opacity: 0.3, borderTopLeftRadius: 6, borderBottomLeftRadius: 6 }} pointerEvents=\"none\">"
new_mask = "<View style={{ position: 'absolute', left: 0, top: 0, width: 103, height: h, overflow: 'hidden', opacity: 0.3 }} pointerEvents=\"none\">"
content = content.replace(old_mask, new_mask)

with open('/home/arch-i7/Proyects/app/src/modulos/inicio/pantallas/InicioPantalla.tsx', 'w') as f:
    f.write(content)
