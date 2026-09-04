import re

with open('/home/arch-i7/Proyects/app/src/modulos/senderos/componentes/mapa/ContenedorMapaSenderos.tsx', 'r') as f:
    content = f.read()

# Replace etiquetaTitulo block
content = re.sub(r'  etiquetaTitulo: \{.*?\},', '''  etiquetaTitulo: {
    color: '#FFFFFF',
    fontFamily: 'MontserratAlternates-Bold',
    fontSize: 26,
    textAlign: 'left',
  },''', content, flags=re.DOTALL)

# Replace etiquetaMeta block
content = re.sub(r'  etiquetaMeta: \{.*?\},', '''  etiquetaMeta: {
    fontFamily: 'MontserratAlternates-Medium',
    fontSize: 15,
    color: 'rgba(255, 255, 255, 0.85)',
    marginTop: 2,
    marginBottom: 8,
    textAlign: 'left',
  },''', content, flags=re.DOTALL)

# Replace the Tooltip Pixel Art block
pixel_old = re.search(r'<View style=\{styles.tooltipPixelesMarco\}>.*?</View>', content, re.DOTALL)
if pixel_old:
    pixel_new = """<View style={styles.tooltipPixelesMarco}>
                       <Svg width={40} height={40}>
                          {/* Bloques de 8x8 */}
                          <Rect x={24} y={24} width={8} height={8} fill="rgba(255,255,255,0.25)" />
                          <Rect x={16} y={24} width={8} height={8} fill="rgba(255,255,255,0.15)" />
                          <Rect x={24} y={16} width={8} height={8} fill="rgba(255,255,255,0.15)" />
                          <Rect x={8} y={24} width={8} height={8} fill="rgba(255,255,255,0.08)" />
                          <Rect x={24} y={8} width={8} height={8} fill="rgba(255,255,255,0.08)" />
                       </Svg>
                    </View>"""
    content = content.replace(pixel_old.group(0), pixel_new)

with open('/home/arch-i7/Proyects/app/src/modulos/senderos/componentes/mapa/ContenedorMapaSenderos.tsx', 'w') as f:
    f.write(content)

