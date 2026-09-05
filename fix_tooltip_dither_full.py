import re

with open('/home/arch-i7/Proyects/app/src/modulos/senderos/componentes/mapa/ContenedorMapaSenderos.tsx', 'r') as f:
    content = f.read()

old_mosaic = "  <View style={{ position: 'absolute', bottom: 0, right: 0, width: 64, height: 64, overflow: 'hidden', borderBottomRightRadius: 20 }} pointerEvents=\"none\">"
new_mosaic = "  <View style={StyleSheet.absoluteFill} pointerEvents=\"none\">"

content = content.replace(old_mosaic, new_mosaic)
content = content.replace("MosaicoEsquina", "MosaicoTooltip")

with open('/home/arch-i7/Proyects/app/src/modulos/senderos/componentes/mapa/ContenedorMapaSenderos.tsx', 'w') as f:
    f.write(content)
