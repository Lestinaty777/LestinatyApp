import re

with open('/home/arch-i7/Proyects/app/src/modulos/senderos/componentes/mapa/ContenedorMapaSenderos.tsx', 'r') as f:
    content = f.read()

# Make Title slightly smaller
content = re.sub(r'  etiquetaTitulo: \{.*?"textAlign": "left".*?\},', '''  etiquetaTitulo: {
    color: '#FFFFFF',
    fontFamily: 'MontserratAlternates-Bold',
    fontSize: 21,
    textAlign: 'left',
  },''', content, flags=re.DOTALL)
content = content.replace("fontSize: 26,", "fontSize: 22,") # fallback if regex misses

# Update Tooltip layout (width, left)
# A typical phone is ~390px wide. We use width: 340 so it has nice margins.
content = re.sub(r'  etiqueta: \{.*?\},', '''  etiqueta: {
    alignItems: 'center',
    left: -120,
    position: 'absolute',
    top: 76,
    width: 340,
    maxWidth: 400,
    zIndex: 10,
  },''', content, flags=re.DOTALL)

# Make pixel art more noticeable (higher opacity and more blocks)
pixel_old_regex = re.compile(r'<View style=\{styles.tooltipPixelesMarco\}>.*?</View>', re.DOTALL)
pixel_new = """<View style={styles.tooltipPixelesMarco}>
                       <Svg width={48} height={48}>
                          <Rect x={32} y={32} width={16} height={16} fill="rgba(255,255,255,0.4)" />
                          <Rect x={16} y={32} width={16} height={16} fill="rgba(255,255,255,0.25)" />
                          <Rect x={32} y={16} width={16} height={16} fill="rgba(255,255,255,0.25)" />
                          <Rect x={0} y={32} width={16} height={16} fill="rgba(255,255,255,0.15)" />
                          <Rect x={16} y={16} width={16} height={16} fill="rgba(255,255,255,0.15)" />
                          <Rect x={32} y={0} width={16} height={16} fill="rgba(255,255,255,0.15)" />
                       </Svg>
                    </View>"""
content = re.sub(pixel_old_regex, pixel_new, content)

with open('/home/arch-i7/Proyects/app/src/modulos/senderos/componentes/mapa/ContenedorMapaSenderos.tsx', 'w') as f:
    f.write(content)

