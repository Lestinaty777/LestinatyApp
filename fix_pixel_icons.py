import re

with open('/home/arch-i7/Proyects/app/src/modulos/inicio/pantallas/InicioPantalla.tsx', 'r') as f:
    content = f.read()

# Fix import path
content = content.replace("'../../../../diseno/iconos/PixelIcon'", "'../../../diseno/iconos/PixelIcon'")

# Fix BotonAccion Icono={Book}
content = content.replace("Icono={Book}", "Icono={() => <PixelIcon name=\"libro\" size={24} color=\"#FFFFFF\" />}")
content = content.replace("Icono={Calendar}", "Icono={() => <PixelIcon name=\"calendario\" size={24} color=\"#FFFFFF\" />}")
content = content.replace("Icono={Sparkles}", "Icono={() => <PixelIcon name=\"destellos\" size={24} color=\"#FFFFFF\" />}")
content = content.replace("Icono={Store}", "Icono={() => <PixelIcon name=\"tienda\" size={24} color=\"#FFFFFF\" />}")

# Fix background icon
content = content.replace("<Book color=\"#FFFFFF\" size={42} opacity={0.15} style={styles.tarjetaIconoFondo} />", "<PixelIcon name=\"libro\" color=\"#FFFFFF\" size={42} style={[styles.tarjetaIconoFondo, { opacity: 0.15 }]} />")

with open('/home/arch-i7/Proyects/app/src/modulos/inicio/pantallas/InicioPantalla.tsx', 'w') as f:
    f.write(content)

