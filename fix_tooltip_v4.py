import re

with open('/home/arch-i7/Proyects/app/src/modulos/senderos/componentes/mapa/ContenedorMapaSenderos.tsx', 'r') as f:
    content = f.read()

# 1. Smaller title
content = re.sub(r'  etiquetaTitulo: \{.*?"fontSize": 22.*?\},', '''  etiquetaTitulo: {
    color: '#FFFFFF',
    fontFamily: 'MontserratAlternates-Bold',
    fontSize: 16,
    textAlign: 'left',
    width: '100%',
  },''', content, flags=re.DOTALL)
content = content.replace("fontSize: 22,", "fontSize: 16,") # fallback

# 2. Fix the arrow rendering (inline top: -12 instead of top: 0, and we'll increase arrow size in styles)
content = content.replace("position: 'absolute', top: 0, left: leftFlechita", "position: 'absolute', top: -10, left: leftFlechita")

content = re.sub(r'  tooltipFlechita: \{.*?\},', '''  tooltipFlechita: {
    width: 24,
    height: 24,
    transform: [{ rotate: '45deg' }],
    zIndex: 1,
  },''', content, flags=re.DOTALL)

# 3. Swap Pixel Art and Button, and expand SVG
# Find the button block
button_regex = re.compile(r'(<Pressable[\s\S]*?</Pressable>)')
button_match = button_regex.search(content)

# Find the pixel art block
pixel_regex = re.compile(r'(<View style=\{styles.tooltipPixelesMarco\}>[\s\S]*?</View>)')
pixel_match = pixel_regex.search(content)

if button_match and pixel_match:
    # First, let's redefine the pixel art to be a full background sprinkle
    new_pixel_art = """<View style={StyleSheet.absoluteFill} pointerEvents="none">
                       <Svg width="100%" height="100%">
                          {/* Partículas sueltas en todo el tooltip */}
                          <Rect x="10%" y="20%" width={8} height={8} fill="rgba(255,255,255,0.05)" />
                          <Rect x="25%" y="60%" width={12} height={12} fill="rgba(255,255,255,0.03)" />
                          <Rect x="80%" y="15%" width={16} height={16} fill="rgba(255,255,255,0.04)" />
                          <Rect x="45%" y="10%" width={8} height={8} fill="rgba(255,255,255,0.06)" />
                          
                          {/* Gran mosaico en la esquina inferior derecha */}
                          <Rect x="85%" y="75%" width={20} height={20} fill="rgba(255,255,255,0.3)" />
                          <Rect x="75%" y="75%" width={20} height={20} fill="rgba(255,255,255,0.2)" />
                          <Rect x="85%" y="55%" width={20} height={20} fill="rgba(255,255,255,0.2)" />
                          
                          <Rect x="65%" y="75%" width={20} height={20} fill="rgba(255,255,255,0.15)" />
                          <Rect x="75%" y="55%" width={20} height={20} fill="rgba(255,255,255,0.15)" />
                          <Rect x="85%" y="35%" width={20} height={20} fill="rgba(255,255,255,0.15)" />
                          
                          <Rect x="55%" y="75%" width={20} height={20} fill="rgba(255,255,255,0.08)" />
                          <Rect x="65%" y="55%" width={20} height={20} fill="rgba(255,255,255,0.08)" />
                          <Rect x="75%" y="35%" width={20} height={20} fill="rgba(255,255,255,0.08)" />
                       </Svg>
                    </View>"""
    
    # And the new 3D Button
    new_button = """<Pressable 
                      disabled={estadoVisual === 'bloqueado'} 
                      onPress={() => completarNodo(indice)}
                      style={({ pressed }) => [styles.botonComenzar, { 
                         backgroundColor: estadoVisual === 'bloqueado' ? 'rgba(0,0,0,0.15)' : color,
                         borderBottomWidth: pressed || estadoVisual === 'bloqueado' ? 0 : 4,
                         borderBottomColor: oscurecer(color, 0.4),
                         marginTop: pressed ? 12 : 8,
                         marginBottom: pressed ? 4 : 0,
                      }]}
                    >
                       <Texto style={[styles.textoBoton, { color: estadoVisual === 'bloqueado' ? 'rgba(255,255,255,0.4)' : '#FFFFFF' }]}>
                         {estadoVisual === 'bloqueado' ? 'Bloqueado' : estadoVisual === 'completado' ? 'Repasar' : 'Comenzar'}
                       </Texto>
                    </Pressable>"""

    # We want new_pixel_art BEFORE new_button. 
    # Current structure is title -> subtitle -> button -> pixels.
    # We remove old pixels entirely, and replace old button with (new_pixel_art + new_button)
    
    content = content.replace(pixel_match.group(0), "")
    content = content.replace(button_match.group(0), new_pixel_art + "\n                    " + new_button)


# Clean up styles
content = re.sub(r'  tooltipPixelesMarco: \{.*?\},', '', content, flags=re.DOTALL)

with open('/home/arch-i7/Proyects/app/src/modulos/senderos/componentes/mapa/ContenedorMapaSenderos.tsx', 'w') as f:
    f.write(content)

