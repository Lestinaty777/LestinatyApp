import re

with open('/home/arch-i7/Proyects/app/src/modulos/inicio/pantallas/InicioPantalla.tsx', 'r') as f:
    content = f.read()

# Replace everything from `navbarContenedor:` to `capaMapa:`
styles_start = content.find('  navbarContenedor: {')
styles_end = content.find('  navbarSuperior: {')
if styles_start != -1 and styles_end != -1:
    new_styles = """  navbarContenedor: {
    marginHorizontal: 20,
    marginTop: 10,
    marginBottom: 10,
    borderRadius: 20,
  },
  carruselSenderos: {
    paddingHorizontal: 15,
    gap: 12,
    alignItems: 'center',
  },
  tarjetaCarrusel: {
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
    borderRadius: 16,
    width: 140,
    height: 100,
    padding: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.6)',
    flexDirection: 'row',
  },
  iconoCarrusel: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  textoCarruselTitulo: {
    fontSize: 12,
    fontFamily: 'MontserratAlternates-Bold',
    color: '#34312E',
  },
  textoCarruselDesc: {
    fontSize: 9,
    fontFamily: 'MontserratAlternates-Medium',
    color: '#555',
    marginTop: 2,
  },
  navbarFila: {
    flexDirection: 'row',
    height: 62,
  },
"""
    content = content[:styles_start] + new_styles + content[styles_end:]

with open('/home/arch-i7/Proyects/app/src/modulos/inicio/pantallas/InicioPantalla.tsx', 'w') as f:
    f.write(content)
