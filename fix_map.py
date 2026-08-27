import re

with open('/home/arch-i7/Proyects/app/src/modulos/senderos/paginas/MapaCompartido.tsx', 'r') as f:
    content = f.read()

# Remove the path SVG lines
# Find the CaminosSVG generation
caminos_regex = re.search(r'(const CaminosSVG = useMemo\(\(\) => \{.*?\n  \}, \[coordsDict\]\);)', content, re.DOTALL)
if caminos_regex:
    content = content.replace(caminos_regex.group(1), "const CaminosSVG = null;")

# Lower ALTURA_PISO from 160 to 90 to make them much closer
content = re.sub(r'const ALTURA_PISO = \d+;', 'const ALTURA_PISO = 85;', content)

# Remove the <Svg> rendering for the background lines
svg_render = """        {/* FONDO SVG (Lineas y Rutas) */}
        <View style={[StyleSheet.absoluteFill, { zIndex: 0 }]} pointerEvents="none">
          <Svg width="100%" height={totalHeight}>
            {CaminosSVG}
          </Svg>
        </View>"""
content = content.replace(svg_render, "")

with open('/home/arch-i7/Proyects/app/src/modulos/senderos/paginas/MapaCompartido.tsx', 'w') as f:
    f.write(content)
