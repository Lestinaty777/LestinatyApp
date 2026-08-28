import re

with open('/home/arch-i7/Proyects/app/src/modulos/senderos/paginas/AnalisisSenderos.tsx', 'r') as f:
    acode = f.read()

# Fix ScrollView import
if "import { View, StyleSheet, Pressable }" in acode:
    acode = acode.replace("import { View, StyleSheet, Pressable }", "import { View, StyleSheet, Pressable, ScrollView }")
elif "import { View, StyleSheet }" in acode:
    acode = acode.replace("import { View, StyleSheet }", "import { View, StyleSheet, Pressable, ScrollView }")
# Just forcefully inject ScrollView
acode = re.sub(r'import { View,([^}]+)} from \'react-native\';', r"import { View, \1, ScrollView } from 'react-native';", acode)

# Fix styles
if "pildoraFiltro" not in acode:
    acode = acode.replace("botonCategoriaPresionado: { opacity: 0.7 },", "botonCategoriaPresionado: { opacity: 0.7 },\n  pildoraFiltro: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 99, borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)', backgroundColor: 'rgba(255,255,255,0.05)' },\n  pildoraTexto: { fontFamily: 'MontserratAlternates-SemiBold', fontSize: 12, color: colores.textoSecundario },")

with open('/home/arch-i7/Proyects/app/src/modulos/senderos/paginas/AnalisisSenderos.tsx', 'w') as f:
    f.write(acode)

