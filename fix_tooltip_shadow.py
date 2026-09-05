import re

with open('/home/arch-i7/Proyects/app/src/modulos/senderos/componentes/mapa/ContenedorMapaSenderos.tsx', 'r') as f:
    content = f.read()

old_jsx = """                  <View style={[styles.tooltipCaja, { backgroundColor: oscurecer(color, 0.75) }]}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>"""

new_jsx = """                  <View style={{ width: '100%' }}>
                    <View style={[styles.tooltipCaja, { position: 'absolute', top: 6, left: 0, right: 0, bottom: -6, backgroundColor: 'rgba(0,0,0,0.3)', shadowColor: 'transparent' }]} />
                    <View style={[styles.tooltipCaja, { backgroundColor: oscurecer(color, 0.75) }]}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>"""

content = content.replace(old_jsx, new_jsx)

# Find the closing tag for tooltipCaja to close the wrapper
old_end = """                    </Pressable>

                    
                  </View>
                </View>
              );})() : null}"""

new_end = """                    </Pressable>

                    
                    </View>
                  </View>
                </View>
              );})() : null}"""

content = content.replace(old_end, new_end)

with open('/home/arch-i7/Proyects/app/src/modulos/senderos/componentes/mapa/ContenedorMapaSenderos.tsx', 'w') as f:
    f.write(content)
