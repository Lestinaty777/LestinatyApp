import re

with open('/home/arch-i7/Proyects/app/src/modulos/senderos/componentes/mapa/ContenedorMapaSenderos.tsx', 'r') as f:
    content = f.read()

# Add Svg, Defs, Pattern, Rect if not already imported from react-native-svg
# It already imports Svg, { Path, Rect } from 'react-native-svg'
content = content.replace("import Svg, { Path, Rect } from 'react-native-svg';", "import Svg, { Path, Rect, Defs, Pattern } from 'react-native-svg';")

# Add the mosaico component before the main component
mosaico_code = """
const MosaicoEsquina = () => (
  <View style={{ position: 'absolute', bottom: 0, right: 0, width: 64, height: 64, overflow: 'hidden', borderBottomRightRadius: 20 }} pointerEvents="none">
    <Svg width="100%" height="100%">
      <Defs>
        <Pattern id="ditherMosaico" patternUnits="userSpaceOnUse" width="8" height="8">
          <Rect x="4" y="0" width="4" height="4" fill="#000000" opacity="0.12" />
          <Rect x="0" y="4" width="4" height="4" fill="#000000" opacity="0.12" />
          <Rect x="0" y="0" width="4" height="4" fill="#FFFFFF" opacity="0.15" />
          <Rect x="4" y="4" width="4" height="4" fill="#FFFFFF" opacity="0.15" />
        </Pattern>
      </Defs>
      {/* Triángulo/Degradado podría ser complejo, pero un rectángulo simple cortado por un radio funciona */}
      <Rect width="100%" height="100%" fill="url(#ditherMosaico)" />
    </Svg>
  </View>
);

"""

content = content.replace("export function ContenedorMapaSenderos", mosaico_code + "export function ContenedorMapaSenderos")

# Add it to the tooltip
old_tooltip = """                    <View style={[styles.tooltipCaja, { backgroundColor: oscurecer(color, 0.75) }]}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>"""

new_tooltip = """                    <View style={[styles.tooltipCaja, { backgroundColor: oscurecer(color, 0.75), overflow: 'hidden' }]}>
                      <MosaicoEsquina />
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>"""

content = content.replace(old_tooltip, new_tooltip)

with open('/home/arch-i7/Proyects/app/src/modulos/senderos/componentes/mapa/ContenedorMapaSenderos.tsx', 'w') as f:
    f.write(content)

