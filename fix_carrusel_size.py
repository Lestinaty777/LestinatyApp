import re

with open('/home/arch-i7/Proyects/app/src/modulos/inicio/pantallas/InicioPantalla.tsx', 'r') as f:
    content = f.read()

# Make the card taller and a bit wider to fit the text
content = content.replace(
    """  tarjetaCarrusel: {
    borderRadius: 16,
    width: 120,
    height: 90,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.6)',
    flexDirection: 'column',
    justifyContent: 'space-between',
  },""",
    """  tarjetaCarrusel: {
    borderRadius: 16,
    width: 135,
    minHeight: 115,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.6)',
    flexDirection: 'column',
    justifyContent: 'space-between',
  },"""
)

# Make the shine much longer to cross the whole card
content = content.replace(
    """  tarjetaBrilloCarrusel: {
    position: 'absolute',
    top: -20,
    left: -30,
    height: 150,
    width: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    transform: [{ rotate: '45deg' }],
  },""",
    """  tarjetaBrilloCarrusel: {
    position: 'absolute',
    top: -50,
    left: -20,
    height: 280,
    width: 35,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    transform: [{ rotate: '45deg' }],
  },"""
)

# Remove any numberOfLines from title to ensure everything is visible
content = content.replace(
    "<Texto style={styles.textoCarruselTitulo} numberOfLines={2}>{asig.titulo}</Texto>",
    "<Texto style={styles.textoCarruselTitulo}>{asig.titulo}</Texto>"
)

with open('/home/arch-i7/Proyects/app/src/modulos/inicio/pantallas/InicioPantalla.tsx', 'w') as f:
    f.write(content)
