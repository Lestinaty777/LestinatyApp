import re

with open('/home/arch-i7/Proyects/app/src/modulos/senderos/componentes/mapa/ContenedorMapaSenderos.tsx', 'r') as f:
    content = f.read()

missing_styles = """  botonComenzar: {
    marginTop: 14,
    paddingVertical: 10,
    paddingHorizontal: 24,
    borderRadius: 14,
    width: '100%',
    alignItems: 'center',
  },
  textoBoton: {
    fontFamily: 'MontserratAlternates-Bold',
    fontSize: 13,
  },"""

if "botonComenzar:" not in content:
    content = content.replace("  etiqueta: {", missing_styles + "\n  etiqueta: {")

with open('/home/arch-i7/Proyects/app/src/modulos/senderos/componentes/mapa/ContenedorMapaSenderos.tsx', 'w') as f:
    f.write(content)

