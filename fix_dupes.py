import re

with open('/home/arch-i7/Proyects/app/src/modulos/inicio/pantallas/InicioPantalla.tsx', 'r') as f:
    content = f.read()

# Borrar la duplicación
content = content.replace("""  const animContenidoEstilos = useAnimatedStyle(() => ({
    opacity: animMenu.value,
    transform: [
      { translateY: -10 * (1 - animMenu.value) },
    ],
  }));""", "")

with open('/home/arch-i7/Proyects/app/src/modulos/inicio/pantallas/InicioPantalla.tsx', 'w') as f:
    f.write(content)
