import re

with open('/home/arch-i7/Proyects/app/src/modulos/inicio/pantallas/InicioPantalla.tsx', 'r') as f:
    content = f.read()

# Reducir targetH
content = content.replace("targetH = 500;", "targetH = 390;")

# Eliminar el termómetro del panel
# El termómetro está entre {/* 3. TERMÓMETRO SEMANAL (VIAJE) */} y </View>\n  );\n}
old_panel = r"\{\/\* 3\. TERMÓMETRO SEMANAL \(VIAJE\) \*\/\}.+?<\/View>\n      \n    <\/View>\n  \);\n\}"

new_panel = r"    </View>\n  );\n}"

content = re.sub(old_panel, new_panel, content, flags=re.DOTALL)

with open('/home/arch-i7/Proyects/app/src/modulos/inicio/pantallas/InicioPantalla.tsx', 'w') as f:
    f.write(content)
