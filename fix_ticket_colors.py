import re

with open('/home/arch-i7/Proyects/app/src/modulos/inicio/pantallas/InicioPantalla.tsx', 'r') as f:
    content = f.read()

# Fix shadow color
content = content.replace(
    """<Path d={path} fill="rgba(0,0,0,0.2)" transform="translate(0, 4)" />""",
    """<Path d={path} fill={oscurecer(asig.color, 0.4)} transform="translate(0, 4)" />"""
)

# Fix shine position back to top: -20, left: 10
content = content.replace(
    """<View style={[styles.tarjetaBrilloCarrusel, { top: -60, left: -20, height: 350, width: 25, backgroundColor: 'rgba(255,255,255,0.08)' }]} pointerEvents="none" />""",
    """<View style={[styles.tarjetaBrilloCarrusel, { top: -20, left: 10, height: 350, width: 25, backgroundColor: 'rgba(255,255,255,0.08)' }]} pointerEvents="none" />"""
)

with open('/home/arch-i7/Proyects/app/src/modulos/inicio/pantallas/InicioPantalla.tsx', 'w') as f:
    f.write(content)
