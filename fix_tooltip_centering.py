import re

with open('/home/arch-i7/Proyects/app/src/modulos/senderos/componentes/mapa/ContenedorMapaSenderos.tsx', 'r') as f:
    content = f.read()

# Make sure we use anchoVentana. It is already imported/defined as useWindowDimensions().width?
# Wait, let's check how it's defined. 
# There is: const { width: anchoVentana, height } = useWindowDimensions();
# Let's replace the render logic for etiqueta.
tooltip_logic_old = """              {esSeleccionado ? (
                <View style={[styles.etiqueta, { transform: [{ scale: escalaEscena }] }]}>
                  <View style={[styles.tooltipFlechita, { backgroundColor: oscurecer(color, 0.75) }]} />
                  <View style={[styles.tooltipCaja, { backgroundColor: oscurecer(color, 0.75) }]}>"""
tooltip_logic_new = """              {esSeleccionado ? (() => {
                  const xRelativoPantalla = anchoEscena / 2;
                  const centroNodoRelativo = 36;
                  const anchoTooltip = 340;
                  const leftEtiqueta = xRelativoPantalla - posicion.x - (anchoTooltip / 2) + centroNodoRelativo;
                  const leftFlechita = centroNodoRelativo - leftEtiqueta - 10;
                  return (
                <View style={[styles.etiqueta, { left: leftEtiqueta }]}>
                  <View style={[styles.tooltipFlechita, { backgroundColor: oscurecer(color, 0.75), position: 'absolute', top: 0, left: leftFlechita }]} />
                  <View style={[styles.tooltipCaja, { backgroundColor: oscurecer(color, 0.75) }]}>"""
content = content.replace(tooltip_logic_old, tooltip_logic_new)

# Add closing `)()` to the tooltip
content = content.replace("""                  </View>
                </View>
              ) : null}""", """                  </View>
                </View>
              );})() : null}""")


# Smaller subtitle, less spacing
content = re.sub(r'  etiquetaMeta: \{.*?\},', '''  etiquetaMeta: {
    fontFamily: 'MontserratAlternates-Medium',
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.85)',
    marginTop: 2,
    marginBottom: 4,
    textAlign: 'left',
  },''', content, flags=re.DOTALL)

content = re.sub(r'  botonComenzar: \{.*?\},', '''  botonComenzar: {
    marginTop: 8,
    paddingVertical: 10,
    paddingHorizontal: 24,
    borderRadius: 14,
    width: '100%',
    alignItems: 'center',
  },''', content, flags=re.DOTALL)

# Extend pixel art
pixel_old_regex = re.compile(r'<View style=\{styles.tooltipPixelesMarco\}>.*?</View>', re.DOTALL)
pixel_new = """<View style={styles.tooltipPixelesMarco}>
                       <Svg width={80} height={80}>
                          {/* Gran mosaico extendido en la esquina */}
                          <Rect x={64} y={64} width={16} height={16} fill="rgba(255,255,255,0.3)" />
                          <Rect x={48} y={64} width={16} height={16} fill="rgba(255,255,255,0.2)" />
                          <Rect x={64} y={48} width={16} height={16} fill="rgba(255,255,255,0.2)" />
                          
                          <Rect x={32} y={64} width={16} height={16} fill="rgba(255,255,255,0.15)" />
                          <Rect x={48} y={48} width={16} height={16} fill="rgba(255,255,255,0.15)" />
                          <Rect x={64} y={32} width={16} height={16} fill="rgba(255,255,255,0.15)" />
                          
                          <Rect x={16} y={64} width={16} height={16} fill="rgba(255,255,255,0.08)" />
                          <Rect x={32} y={48} width={16} height={16} fill="rgba(255,255,255,0.08)" />
                          <Rect x={48} y={32} width={16} height={16} fill="rgba(255,255,255,0.08)" />
                          <Rect x={64} y={16} width={16} height={16} fill="rgba(255,255,255,0.08)" />
                       </Svg>
                    </View>"""
content = re.sub(pixel_old_regex, pixel_new, content)

content = re.sub(r'  tooltipPixelesMarco: \{.*?\},', '''  tooltipPixelesMarco: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 80,
    height: 80,
  },''', content, flags=re.DOTALL)

# Adjust etiqueta styles to remove left since it's dynamic
content = re.sub(r'  etiqueta: \{.*?\},', '''  etiqueta: {
    alignItems: 'center',
    position: 'absolute',
    top: 76,
    width: 340,
    maxWidth: 400,
    zIndex: 10,
  },''', content, flags=re.DOTALL)

with open('/home/arch-i7/Proyects/app/src/modulos/senderos/componentes/mapa/ContenedorMapaSenderos.tsx', 'w') as f:
    f.write(content)

