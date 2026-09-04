import re

with open('/home/arch-i7/Proyects/app/src/modulos/inicio/pantallas/InicioPantalla.tsx', 'r') as f:
    content = f.read()

# Add SVG imports if not present
if 'import Svg' not in content:
    content = content.replace("import React", "import Svg, { Rect, Defs, Pattern } from 'react-native-svg';\nimport React")

# Add TexturaPixelArt
textura_comp = """
const TexturaPixelArt = () => (
  <View style={StyleSheet.absoluteFill} pointerEvents="none">
    <Svg width="100%" height="100%">
      <Defs>
        <Pattern id="dither" patternUnits="userSpaceOnUse" width="4" height="4">
          <Rect x="0" y="0" width="2" height="2" fill="#000000" opacity="0.1" />
          <Rect x="2" y="2" width="2" height="2" fill="#000000" opacity="0.1" />
        </Pattern>
      </Defs>
      <Rect width="100%" height="100%" fill="url(#dither)" />
    </Svg>
  </View>
);
"""
if 'TexturaPixelArt' not in content:
    content = content.replace("function oscurecer", textura_comp + "\nfunction oscurecer")

# Add styles
styles_to_add = """  tarjetaContenedor: {
    marginHorizontal: 20,
    marginTop: 20,
    position: 'relative',
    height: 100,
  },
  tarjetaAsignaturaBase: {
    position: 'absolute',
    top: 6,
    left: 0,
    right: 0,
    height: 100,
    borderRadius: 26,
  },
  tarjetaBrillo: {
    position: 'absolute',
    top: -30,
    left: -50,
    right: 0,
    height: 150,
    width: 80,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    transform: [{ rotate: '45deg' }],
  },
  tarjetaIconoFondo: {
    position: 'absolute',
    right: -10,
    bottom: -10,
  },
"""
if 'tarjetaContenedor:' not in content:
    content = content.replace("  tarjetaAsignatura: {", styles_to_add + "  tarjetaAsignatura: {\n    position: 'absolute',\n    top: 0,\n    left: 0,\n    right: 0,\n    height: 100,\n    padding: 20,\n    borderRadius: 24,\n    overflow: 'hidden',\n    justifyContent: 'center',\n    borderTopWidth: 1.5,\n    borderTopColor: 'rgba(255, 255, 255, 0.35)',\n    borderLeftWidth: 1,\n    borderLeftColor: 'rgba(255, 255, 255, 0.2)',")
    
# Replace the card JSX
old_card_pattern = re.compile(r'\{\/\* Tarjeta de Asignatura \/ Tema actual \*\/\}.*?<\/View>', re.DOTALL)

new_card = """{/* Tarjeta de Asignatura (3D Node Style) */}
        <View style={styles.tarjetaContenedor}>
          <View style={[styles.tarjetaAsignaturaBase, { backgroundColor: oscurecer(biomas.inicio.MasterColor, 0.6) }]}>
            <View style={{...StyleSheet.absoluteFill as any, overflow: 'hidden', borderRadius: 26}}>
               <TexturaPixelArt />
            </View>
          </View>
          <View style={[styles.tarjetaAsignatura, { backgroundColor: biomas.inicio.MasterColor }]}>
            <TexturaPixelArt />
            <View style={styles.tarjetaBrillo} />
            <PixelartIcon name="book-open" color="#FFFFFF" size={42} style={[styles.tarjetaIconoFondo, { opacity: 0.15 }]} />
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 4 }}>
              <PixelartIcon name="book-open" size={26} color="#FFFFFF" />
              <Texto style={[styles.tituloAsignatura, { marginBottom: 0 }]}>Anatomía I</Texto>
            </View>
            <Texto style={styles.descAsignatura}>Sistema óseo, cráneo y articulaciones superiores.</Texto>
          </View>
        </View>
        
        {/* Espacio que empuja el mapa hacia abajo para respetar el 80% */}
        <View style={{ height: 24 }} />"""

content = old_card_pattern.sub(new_card, content)

# Remove the old <View style={styles.espacioFlexible} /> because we replaced it with height: 24
content = content.replace("<View style={styles.espacioFlexible} />", "")

with open('/home/arch-i7/Proyects/app/src/modulos/inicio/pantallas/InicioPantalla.tsx', 'w') as f:
    f.write(content)

