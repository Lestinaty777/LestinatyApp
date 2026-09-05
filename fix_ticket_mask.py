import re

with open('/home/arch-i7/Proyects/app/src/modulos/inicio/pantallas/InicioPantalla.tsx', 'r') as f:
    content = f.read()

# Update the mask View to have border radius on the left side
old_mask = "<View style={{ position: 'absolute', left: 0, top: 0, width: 103, height: h, overflow: 'hidden', opacity: 0.3 }} pointerEvents=\"none\">"
new_mask = "<View style={{ position: 'absolute', left: 0, top: 0, width: 103, height: h, overflow: 'hidden', opacity: 0.3, borderTopLeftRadius: 6, borderBottomLeftRadius: 6 }} pointerEvents=\"none\">"

content = content.replace(old_mask, new_mask)

with open('/home/arch-i7/Proyects/app/src/modulos/inicio/pantallas/InicioPantalla.tsx', 'w') as f:
    f.write(content)
