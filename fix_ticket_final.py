import re

with open('/home/arch-i7/Proyects/app/src/modulos/inicio/pantallas/InicioPantalla.tsx', 'r') as f:
    content = f.read()

# Make the shadow match the main card's shadow darkness (0.6)
content = content.replace(
    """<Path d={path} fill={oscurecer(asig.color, 0.4)} transform="translate(0, 4)" />""",
    """<Path d={path} fill={oscurecer(asig.color, 0.6)} transform="translate(0, 4)" />"""
)

# Move shine towards top-left corner (-50, -40)
content = content.replace(
    """<View style={[styles.tarjetaBrilloCarrusel, { top: -20, left: 10, height: 350, width: 25, backgroundColor: 'rgba(255,255,255,0.08)' }]} pointerEvents="none" />""",
    """<View style={[styles.tarjetaBrilloCarrusel, { top: -50, left: -40, height: 350, width: 25, backgroundColor: 'rgba(255,255,255,0.08)' }]} pointerEvents="none" />"""
)

with open('/home/arch-i7/Proyects/app/src/modulos/inicio/pantallas/InicioPantalla.tsx', 'w') as f:
    f.write(content)
