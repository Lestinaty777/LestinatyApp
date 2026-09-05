import re

with open('/home/arch-i7/Proyects/app/src/modulos/inicio/pantallas/InicioPantalla.tsx', 'r') as f:
    content = f.read()

content = content.replace(
    """  tarjetaBrilloCarrusel: {
    position: 'absolute',
    top: -10,
    left: 40,""",
    """  tarjetaBrilloCarrusel: {
    position: 'absolute',
    top: -30,
    left: 10,"""
)

with open('/home/arch-i7/Proyects/app/src/modulos/inicio/pantallas/InicioPantalla.tsx', 'w') as f:
    f.write(content)
