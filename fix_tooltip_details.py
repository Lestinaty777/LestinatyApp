import re

with open('/home/arch-i7/Proyects/app/src/modulos/senderos/componentes/mapa/ContenedorMapaSenderos.tsx', 'r') as f:
    content = f.read()

# 1. Fix tooltipCaja alignItems
content = re.sub(r'  tooltipCaja: \{.*?\},', '''  tooltipCaja: {
    borderRadius: 20,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 20,
    alignItems: 'flex-start',
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 10,
    position: 'relative',
    overflow: 'hidden',
  },''', content, flags=re.DOTALL)

# 2. Add line height to subtitle
content = re.sub(r'  etiquetaMeta: \{.*?\},', '''  etiquetaMeta: {
    fontFamily: 'MontserratAlternates-Medium',
    fontSize: 12,
    lineHeight: 16,
    color: 'rgba(255, 255, 255, 0.85)',
    marginTop: 4,
    marginBottom: 4,
    textAlign: 'left',
    width: '100%',
  },''', content, flags=re.DOTALL)

# Also ensure title has width 100%
content = re.sub(r'  etiquetaTitulo: \{.*?\},', '''  etiquetaTitulo: {
    color: '#FFFFFF',
    fontFamily: 'MontserratAlternates-Bold',
    fontSize: 22,
    textAlign: 'left',
    width: '100%',
  },''', content, flags=re.DOTALL)


# 3. Extend pixel art even more (make it 100x100)
pixel_old_regex = re.compile(r'<View style=\{styles.tooltipPixelesMarco\}>.*?</View>', re.DOTALL)
pixel_new = """<View style={styles.tooltipPixelesMarco}>
                       <Svg width={100} height={100}>
                          {/* Mosaico masivo invadiendo la esquina */}
                          <Rect x={80} y={80} width={20} height={20} fill="rgba(255,255,255,0.4)" />
                          <Rect x={60} y={80} width={20} height={20} fill="rgba(255,255,255,0.25)" />
                          <Rect x={80} y={60} width={20} height={20} fill="rgba(255,255,255,0.25)" />
                          
                          <Rect x={40} y={80} width={20} height={20} fill="rgba(255,255,255,0.15)" />
                          <Rect x={60} y={60} width={20} height={20} fill="rgba(255,255,255,0.15)" />
                          <Rect x={80} y={40} width={20} height={20} fill="rgba(255,255,255,0.15)" />
                          
                          <Rect x={20} y={80} width={20} height={20} fill="rgba(255,255,255,0.1)" />
                          <Rect x={40} y={60} width={20} height={20} fill="rgba(255,255,255,0.1)" />
                          <Rect x={60} y={40} width={20} height={20} fill="rgba(255,255,255,0.1)" />
                          <Rect x={80} y={20} width={20} height={20} fill="rgba(255,255,255,0.1)" />

                          <Rect x={0} y={80} width={20} height={20} fill="rgba(255,255,255,0.05)" />
                          <Rect x={20} y={60} width={20} height={20} fill="rgba(255,255,255,0.05)" />
                          <Rect x={40} y={40} width={20} height={20} fill="rgba(255,255,255,0.05)" />
                          <Rect x={60} y={20} width={20} height={20} fill="rgba(255,255,255,0.05)" />
                          <Rect x={80} y={0} width={20} height={20} fill="rgba(255,255,255,0.05)" />
                       </Svg>
                    </View>"""
content = re.sub(pixel_old_regex, pixel_new, content)

content = re.sub(r'  tooltipPixelesMarco: \{.*?\},', '''  tooltipPixelesMarco: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 100,
    height: 100,
  },''', content, flags=re.DOTALL)

# 4. Button press effect
button_old = """style={[styles.botonComenzar, { backgroundColor: estadoVisual === 'bloqueado' ? 'rgba(0,0,0,0.15)' : color }]}"""
button_new = """style={({ pressed }) => [styles.botonComenzar, { backgroundColor: estadoVisual === 'bloqueado' ? 'rgba(0,0,0,0.15)' : color, transform: [{ scale: pressed ? 0.95 : 1 }] }]}"""
content = content.replace(button_old, button_new)

with open('/home/arch-i7/Proyects/app/src/modulos/senderos/componentes/mapa/ContenedorMapaSenderos.tsx', 'w') as f:
    f.write(content)

