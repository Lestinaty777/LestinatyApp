import re

with open('/home/arch-i7/Proyects/app/src/modulos/senderos/paginas/MapaCompartido.tsx', 'r') as f:
    content = f.read()

# Add missing imports
if "Animated," not in content:
    content = content.replace("import { Dimensions, ScrollView, StyleSheet, View } from 'react-native';", "import { Animated, Dimensions, Pressable, ScrollView, StyleSheet, View } from 'react-native';")

if "hapticSeguro" not in content:
    content = content.replace("import { RecuadroGlass, Texto, colores } from '../../../diseno';", "import { RecuadroGlass, Texto, colores } from '../../../diseno';\nimport { hapticSeguro } from '../../../nucleo/dispositivo/haptics';")

with open('/home/arch-i7/Proyects/app/src/modulos/senderos/paginas/MapaCompartido.tsx', 'w') as f:
    f.write(content)
