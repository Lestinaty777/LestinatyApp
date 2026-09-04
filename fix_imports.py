import re

with open('/home/arch-i7/Proyects/app/src/modulos/inicio/pantallas/InicioPantalla.tsx', 'r') as f:
    content = f.read()

# Find all SVG imports and remove them, then add exactly one at the top
content = re.sub(r"import Svg, \{ Rect, Defs, Pattern \} from 'react-native-svg';\n", "", content)
content = "import Svg, { Rect, Defs, Pattern } from 'react-native-svg';\n" + content

with open('/home/arch-i7/Proyects/app/src/modulos/inicio/pantallas/InicioPantalla.tsx', 'w') as f:
    f.write(content)

