import re

with open('/home/arch-i7/Proyects/app/src/modulos/inicio/pantallas/InicioPantalla.tsx', 'r') as f:
    content = f.read()

content = content.replace(
    """  textoCarruselTitulo: {
    fontSize: 11,
    fontFamily: 'MontserratAlternates-Bold',
    color: '#FFFFFF',
  },""",
    """  textoCarruselTitulo: {
    fontSize: 11,
    fontFamily: 'MontserratAlternates-Bold',
    color: '#FFFFFF',
    lineHeight: 13,
  },"""
)

with open('/home/arch-i7/Proyects/app/src/modulos/inicio/pantallas/InicioPantalla.tsx', 'w') as f:
    f.write(content)
