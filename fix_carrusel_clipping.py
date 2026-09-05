import re

with open('/home/arch-i7/Proyects/app/src/modulos/inicio/pantallas/InicioPantalla.tsx', 'r') as f:
    content = f.read()

# 1. Aumentar la altura de expansión del menú desplegable para que la tarjeta no se corte
content = content.replace("height: 62 + 130 * animMenu.value,", "height: 62 + 150 * animMenu.value,")

# 2. Arreglar el icono de fondo (hacerlo muy transparente y enviarlo al fondo)
old_bg_icon = "<View style={{ position: 'absolute', right: -10, bottom: -10, opacity: 0.7 }}>"
new_bg_icon = "<View style={{ position: 'absolute', right: -15, bottom: -15, opacity: 0.12, zIndex: 0 }}>"
content = content.replace(old_bg_icon, new_bg_icon)

# 3. Darle zIndex alto al contenedor de texto para que esté siempre por encima del icono
old_text_container = "<View style={{ flex: 1, justifyContent: 'flex-end' }}>"
new_text_container = "<View style={{ flex: 1, justifyContent: 'flex-end', zIndex: 10 }}>"
content = content.replace(old_text_container, new_text_container)

with open('/home/arch-i7/Proyects/app/src/modulos/inicio/pantallas/InicioPantalla.tsx', 'w') as f:
    f.write(content)
