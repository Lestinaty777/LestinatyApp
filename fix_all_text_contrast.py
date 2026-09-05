import re

with open('/home/arch-i7/Proyects/app/src/modulos/inicio/pantallas/InicioPantalla.tsx', 'r') as f:
    content = f.read()

# 1. En los tickets (PASE DE ACCESO y Nº 0X)
content = content.replace("color: 'rgba(255,255,255,0.6)'", "color: 'rgba(255,255,255,0.95)'")
content = content.replace("color: 'rgba(255, 255, 255, 0.6)'", "color: 'rgba(255,255,255,0.95)'")

# 2. En el panel de Racha (VITALIDAD, XP SEMANAL, Días)
content = content.replace("color: 'rgba(255,255,255,0.8)'", "color: '#FFFFFF'")
content = content.replace("color: d.hoy ? '#FFFFFF' : 'rgba(255,255,255,0.7)'", "color: '#FFFFFF'")

with open('/home/arch-i7/Proyects/app/src/modulos/inicio/pantallas/InicioPantalla.tsx', 'w') as f:
    f.write(content)
