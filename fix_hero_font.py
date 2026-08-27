import re
with open('/home/arch-i7/Proyects/app/src/modulos/senderos/paginas/CompartidosSenderos.tsx', 'r') as f:
    content = f.read()

content = content.replace('''  heroSubtitulo: {
    color: colores.textoSecundario,
    fontFamily: 'MontserratAlternates-SemiBold',
    fontSize: 8,''', '''  heroSubtitulo: {
    color: colores.textoSecundario,
    fontFamily: 'MontserratAlternates-SemiBold',
    fontSize: 10,''')

with open('/home/arch-i7/Proyects/app/src/modulos/senderos/paginas/CompartidosSenderos.tsx', 'w') as f:
    f.write(content)
