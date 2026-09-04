import re

with open('/home/arch-i7/Proyects/app/src/modulos/senderos/componentes/mapa/ContenedorMapaSenderos.tsx', 'r') as f:
    content = f.read()

# Make sure TouchableWithoutFeedback is imported
if 'TouchableWithoutFeedback' not in content:
    content = content.replace("import { Animated, Image, ScrollView, StyleSheet, useWindowDimensions, View, Pressable } from 'react-native';", "import { Animated, Image, ScrollView, StyleSheet, useWindowDimensions, View, Pressable, TouchableWithoutFeedback } from 'react-native';")

# Wrap escenaPerspectiva
old_view = "<View style={[styles.escenaPerspectiva, { height: altoContenido, width: anchoEscena }]}>"
new_view = "<TouchableWithoutFeedback onPress={() => setSeleccionado(null)}>\n      <View style={[styles.escenaPerspectiva, { height: altoContenido, width: anchoEscena }]}>"
content = content.replace(old_view, new_view)

old_end_view = "</View>\n\n      {nodoSeleccionado ? <View accessibilityElementsHidden style={styles.lectorOculto}><Texto>{nodoSeleccionado.titulo}</Texto></View> : null}\n    </ScrollView>"
new_end_view = "</View>\n      </TouchableWithoutFeedback>\n\n      {nodoSeleccionado ? <View accessibilityElementsHidden style={styles.lectorOculto}><Texto>{nodoSeleccionado.titulo}</Texto></View> : null}\n    </ScrollView>"
content = content.replace(old_end_view, new_end_view)

# Wait, if we set setSeleccionado(null), the type might be string. We can set it to empty string ''
new_view2 = "<TouchableWithoutFeedback onPress={() => setSeleccionado('')}>\n      <View style={[styles.escenaPerspectiva, { height: altoContenido, width: anchoEscena }]}>"
content = content.replace(new_view, new_view2)

with open('/home/arch-i7/Proyects/app/src/modulos/senderos/componentes/mapa/ContenedorMapaSenderos.tsx', 'w') as f:
    f.write(content)

