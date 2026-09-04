import re

with open('/home/arch-i7/Proyects/app/src/modulos/senderos/componentes/mapa/ContenedorMapaSenderos.tsx', 'r') as f:
    content = f.read()

# 1. Revert Pixel Art to the corner block (from fix_tooltip_size.py)
# First find the absoluteFill pixel art and remove it
abs_pixel_regex = re.compile(r'<View style=\{StyleSheet\.absoluteFill\} pointerEvents="none">[\s\S]*?</View>')
content = re.sub(abs_pixel_regex, '', content)

# Now inject the old corner pixel art
# We need to insert it right before the </View> that closes tooltipCaja
tooltip_caja_end = """                    </Pressable>
                  </View>"""
old_pixel_art = """                    </Pressable>
                    <View style={styles.tooltipPixelesMarco}>
                       <Svg width={48} height={48}>
                          <Rect x={32} y={32} width={16} height={16} fill="rgba(255,255,255,0.4)" />
                          <Rect x={16} y={32} width={16} height={16} fill="rgba(255,255,255,0.25)" />
                          <Rect x={32} y={16} width={16} height={16} fill="rgba(255,255,255,0.25)" />
                          <Rect x={0} y={32} width={16} height={16} fill="rgba(255,255,255,0.15)" />
                          <Rect x={16} y={16} width={16} height={16} fill="rgba(255,255,255,0.15)" />
                          <Rect x={32} y={0} width={16} height={16} fill="rgba(255,255,255,0.15)" />
                       </Svg>
                    </View>
                  </View>"""
content = content.replace(tooltip_caja_end, old_pixel_art)

# Re-add tooltipPixelesMarco styles
content = content.replace("  etiqueta: {", """  tooltipPixelesMarco: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 48,
    height: 48,
  },
  etiqueta: {""")

# 2. Build the realistic 3D Button!
old_button_regex = re.compile(r'<Pressable[\s\S]*?</Pressable>')
new_button = """<Pressable 
                      disabled={estadoVisual === 'bloqueado'} 
                      onPress={() => completarNodo(indice)}
                      style={({ pressed }) => [styles.botonComenzarContenedor, { marginTop: 14 }]}
                    >
                      {({ pressed }) => {
                        const hundido = pressed || estadoVisual === 'bloqueado';
                        return (
                          <View style={{ width: '100%', alignItems: 'center' }}>
                            {/* Extrusión (Sombra inferior fija) */}
                            <View style={[styles.botonComenzar, styles.botonComenzarExtrusion, { 
                               backgroundColor: oscurecer(color, 0.5),
                               display: estadoVisual === 'bloqueado' ? 'none' : 'flex'
                            }]} />
                            
                            {/* Superficie del botón */}
                            <View style={[styles.botonComenzar, { 
                               backgroundColor: estadoVisual === 'bloqueado' ? 'rgba(0,0,0,0.15)' : color,
                               transform: [{ translateY: hundido ? 4 : 0 }] 
                            }]}>
                               {/* Bisel (Brillo superior) */}
                               <View style={[styles.botonBisel, estadoVisual === 'bloqueado' && { borderColor: 'rgba(255,255,255,0.1)' }]} />
                               
                               <Texto style={[styles.textoBoton, { color: estadoVisual === 'bloqueado' ? 'rgba(255,255,255,0.4)' : '#FFFFFF' }]}>
                                 {estadoVisual === 'bloqueado' ? 'Bloqueado' : estadoVisual === 'completado' ? 'Repasar' : 'Comenzar'}
                               </Texto>
                            </View>
                          </View>
                        );
                      }}
                    </Pressable>"""
content = re.sub(old_button_regex, new_button, content)

# 3. Update button styles
styles_button_regex = re.compile(r'  botonComenzar: \{.*?\},', re.DOTALL)
new_button_styles = """  botonComenzarContenedor: {
    width: '100%',
    height: 44, // Fixed height to prevent layout jumps
    alignItems: 'center',
    zIndex: 2,
  },
  botonComenzar: {
    width: '100%',
    height: 40,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'absolute',
    top: 0,
  },
  botonComenzarExtrusion: {
    top: 4,
  },
  botonBisel: {
    position: 'absolute',
    top: 2,
    left: 4,
    right: 4,
    bottom: 4,
    borderRadius: 12,
    borderTopWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.4)',
    pointerEvents: 'none',
  },"""
content = re.sub(styles_button_regex, new_button_styles, content)

with open('/home/arch-i7/Proyects/app/src/modulos/senderos/componentes/mapa/ContenedorMapaSenderos.tsx', 'w') as f:
    f.write(content)

