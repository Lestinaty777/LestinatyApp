import re

with open('/home/arch-i7/Proyects/app/src/modulos/inicio/pantallas/InicioPantalla.tsx', 'r') as f:
    content = f.read()

# Increase height slightly and adjust padding to give the text container more vertical space
content = content.replace(
    """  tarjetaCarrusel: {
    borderRadius: 16,
    width: 120,
    height: 90,
    padding: 12,""",
    """  tarjetaCarrusel: {
    borderRadius: 16,
    width: 125,
    height: 98,
    paddingHorizontal: 12,
    paddingVertical: 10,"""
)

# Also ensure we remove any hidden line-height restrictions on the text if any
# (No line height was explicitly set, but just in case, we'll let it flow)
content = content.replace("height: 62 + 130 * animMenu.value,", "height: 62 + 140 * animMenu.value,")

with open('/home/arch-i7/Proyects/app/src/modulos/inicio/pantallas/InicioPantalla.tsx', 'w') as f:
    f.write(content)
