import re

with open('/home/arch-i7/Proyects/app/src/modulos/inicio/pantallas/InicioPantalla.tsx', 'r') as f:
    content = f.read()

# 1. Modificar "PASE DE ACCESO"
old_pase = "<Texto style={{ fontSize: 7, color: 'rgba(255,255,255,0.6)', fontFamily: 'Montserrat-Bold', letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 2 }}>PASE DE ACCESO</Texto>"
new_pase = "<Texto style={{ fontSize: 6, color: 'rgba(255,255,255,0.6)', fontFamily: 'Montserrat-Bold', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 2 }} numberOfLines={1}>PASE DE ACCESO</Texto>"
content = content.replace(old_pase, new_pase)

# 2. Modificar "Nº 01" a la esquina inferior derecha
old_n01 = "<TextoRN style={{ position: 'absolute', right: -3, top: 40, fontSize: 7, color: 'rgba(255,255,255,0.6)', transform: [{ rotate: '90deg' }], fontFamily: 'Montserrat-Bold' }}>Nº 01</TextoRN>"
new_n01 = "<TextoRN style={{ position: 'absolute', right: 8, bottom: 8, fontSize: 7, color: 'rgba(255,255,255,0.6)', fontFamily: 'Montserrat-Bold' }}>Nº 01</TextoRN>"
content = content.replace(old_n01, new_n01)

with open('/home/arch-i7/Proyects/app/src/modulos/inicio/pantallas/InicioPantalla.tsx', 'w') as f:
    f.write(content)
