import re

with open('/home/arch-i7/Proyects/app/src/modulos/inicio/pantallas/InicioPantalla.tsx', 'r') as f:
    content = f.read()

# Make ArcoTransicion use height instead of flex: 1
styles_arco_old = """  contenedorArco: {
    flex: 1,
    justifyContent: 'flex-end',
    alignItems: 'center',
    overflow: 'hidden',
  },"""
styles_arco_new = """  contenedorArco: {
    height: 60,
    marginTop: 20,
    justifyContent: 'flex-end',
    alignItems: 'center',
    overflow: 'hidden',
  },"""
content = content.replace(styles_arco_old, styles_arco_new)

# Change capaMapa to flex: 1
capa_old = """  capaMapa: {
    height: '80%', // Forzamos el 80% de altura estricto
    overflow: 'hidden',
  }"""
capa_new = """  capaMapa: {
    flex: 1,
    overflow: 'hidden',
  }"""
content = content.replace(capa_old, capa_new)

# Also fix the radius of arcoPixeles to something valid
arco_p_old = """  arcoPixeles: {
    width: '120%',
    height: 100,
    borderTopLeftRadius: 300,
    borderTopRightRadius: 300,"""
arco_p_new = """  arcoPixeles: {
    width: '120%',
    height: 80,
    borderTopLeftRadius: 100,
    borderTopRightRadius: 100,"""
content = content.replace(arco_p_old, arco_p_new)

with open('/home/arch-i7/Proyects/app/src/modulos/inicio/pantallas/InicioPantalla.tsx', 'w') as f:
    f.write(content)

