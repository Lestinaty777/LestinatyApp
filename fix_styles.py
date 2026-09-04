import re

with open('/home/arch-i7/Proyects/app/src/modulos/inicio/pantallas/InicioPantalla.tsx', 'r') as f:
    content = f.read()

# completely replace tarjetaAsignatura block
pattern = re.compile(r'  tarjetaAsignatura: \{.*?\},\n', re.DOTALL)
new_style = """  tarjetaAsignatura: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 100,
    padding: 20,
    borderRadius: 24,
    overflow: 'hidden',
    justifyContent: 'center',
    borderTopWidth: 1.5,
    borderTopColor: 'rgba(255, 255, 255, 0.35)',
    borderLeftWidth: 1,
    borderLeftColor: 'rgba(255, 255, 255, 0.2)',
  },
"""
content = pattern.sub(new_style, content)

with open('/home/arch-i7/Proyects/app/src/modulos/inicio/pantallas/InicioPantalla.tsx', 'w') as f:
    f.write(content)

