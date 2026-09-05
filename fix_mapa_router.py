import re

with open('/home/arch-i7/Proyects/app/src/modulos/senderos/componentes/mapa/ContenedorMapaSenderos.tsx', 'r') as f:
    content = f.read()

# Add router import
content = content.replace("import { Animated, Image, ScrollView, StyleSheet, useWindowDimensions, View, Pressable, TouchableWithoutFeedback } from 'react-native';", "import { Animated, Image, ScrollView, StyleSheet, useWindowDimensions, View, Pressable, TouchableWithoutFeedback } from 'react-native';\nimport { useRouter } from 'expo-router';")

# Add router hook
content = content.replace("  const { width } = useWindowDimensions();", "  const { width } = useWindowDimensions();\n  const router = useRouter();")

# Modify completion logic
old_comp = "function completarNodo(indice: number) {"
new_comp = """function completarNodo(indice: number) {
    // MOCKUP: Al darle comenzar, navegamos a la pantalla de lección para ver el SDUI
    router.push('/senderos/leccion');
    return;
"""
content = content.replace(old_comp, new_comp)

with open('/home/arch-i7/Proyects/app/src/modulos/senderos/componentes/mapa/ContenedorMapaSenderos.tsx', 'w') as f:
    f.write(content)
