import re

with open('/home/arch-i7/Proyects/app/src/modulos/senderos/paginas/CompartidosSenderos.tsx', 'r') as f:
    content = f.read()

# Replace shelfBase dark colors with beige
content = content.replace('stopColor="#2A241D"', 'stopColor="#E8DCC8"')
content = content.replace('stopColor="#1A1510"', 'stopColor="#D4C4A9"')

# Wait, the user wants the bottom part red.
# In the SVG:
# <Path d="M0 85 L400 85 L400 95 L0 95 Z" fill="url(#glassLip)" />
# Let's change the glassLip gradient to be red-based, or just change the shadow/lip to red.
# User said "la de abajo color rojo". I will make the front lip a solid red instead of glass, or a red gradient.

red_lip = """
          <LinearGradient id="redLip" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor="#FF3B30" stopOpacity="1" />
            <Stop offset="1" stopColor="#B3241F" stopOpacity="1" />
          </LinearGradient>
"""

# Insert the redLip gradient next to glassLip
content = content.replace('<LinearGradient id="glassLip"', red_lip + '\n          <LinearGradient id="glassLip"')

# Apply the redLip to the front lip
content = content.replace('fill="url(#glassLip)"', 'fill="url(#redLip)"')

with open('/home/arch-i7/Proyects/app/src/modulos/senderos/paginas/CompartidosSenderos.tsx', 'w') as f:
    f.write(content)
