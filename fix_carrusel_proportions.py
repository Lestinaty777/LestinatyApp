import re

with open('/home/arch-i7/Proyects/app/src/modulos/inicio/pantallas/InicioPantalla.tsx', 'r') as f:
    content = f.read()

# Revert to tighter proportions since description is gone
content = content.replace(
    """  tarjetaCarrusel: {
    borderRadius: 16,
    width: 135,
    minHeight: 115,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.6)',
    flexDirection: 'column',
    justifyContent: 'space-between',
  },""",
    """  tarjetaCarrusel: {
    borderRadius: 16,
    width: 120,
    height: 90,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.6)',
    flexDirection: 'column',
    justifyContent: 'space-between',
  },"""
)

# And reduce the menu expansion back to 130 since we don't need 150 anymore
content = content.replace("height: 62 + 150 * animMenu.value,", "height: 62 + 130 * animMenu.value,")

with open('/home/arch-i7/Proyects/app/src/modulos/inicio/pantallas/InicioPantalla.tsx', 'w') as f:
    f.write(content)
