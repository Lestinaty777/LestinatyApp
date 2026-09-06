import re

with open('/home/arch-i7/Proyects/app/src/modulos/inicio/pantallas/InicioPantalla.tsx', 'r') as f:
    content = f.read()

# 1. Adjust height for 'courses'
content = content.replace("if (activeMenu === 'courses') targetH = 115;", "if (activeMenu === 'courses') targetH = 200;")

# 2. Inject the brutalist header before the ScrollView
old_courses_block = r"\{activeMenu === 'courses' && \(\n\s*<ScrollView horizontal showsHorizontalScrollIndicator=\{false\} contentContainerStyle=\{styles\.carruselSenderos\} style=\{\{ flex: 1 \}\}>"

new_courses_block = """{activeMenu === 'courses' && (
                <View style={{ flex: 1, paddingHorizontal: 20, paddingTop: 5, paddingBottom: 5 }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 20 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                      <View style={{ width: 42, height: 42, borderRadius: 8, backgroundColor: '#4A8BB3', borderBottomWidth: 4, borderBottomColor: oscurecer('#4A8BB3', 0.6), justifyContent: 'center', alignItems: 'center' }}>
                        <BookOpen color="#FFFFFF" size={24} fill="#FFFFFF" />
                      </View>
                      <View>
                        <Texto style={{ fontSize: 9, color: 'rgba(0,0,0,0.5)', fontFamily: 'Montserrat-Bold', letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 0 }}>INVENTARIO ACTIVO</Texto>
                        <Texto style={{ fontSize: 22, fontFamily: 'Montserrat-Bold', color: '#111111' }}>{ASIGNATURAS.length} Módulos</Texto>
                      </View>
                    </View>
                    <View style={{ alignItems: 'flex-end' }}>
                      <Texto style={{ fontSize: 8, color: 'rgba(0,0,0,0.5)', fontFamily: 'Montserrat-Bold', letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 2 }}>PROGRESO GLOBAL</Texto>
                      <View style={{ backgroundColor: '#111111', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, borderBottomWidth: 2, borderBottomColor: '#000000' }}>
                        <Texto style={{ fontSize: 13, fontFamily: 'Montserrat-Bold', color: '#FFFFFF' }}>12%</Texto>
                      </View>
                    </View>
                  </View>
                  
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 15, paddingBottom: 15 }} style={{ flex: 1, overflow: 'visible' }}>"""

content = re.sub(old_courses_block, new_courses_block, content)

# 3. Close the extra View wrapper around the ScrollView
old_close = r"<\/ScrollView>\n\s*\)\}"
new_close = """</ScrollView>\n                </View>\n              )}"""
content = re.sub(old_close, new_close, content)

with open('/home/arch-i7/Proyects/app/src/modulos/inicio/pantallas/InicioPantalla.tsx', 'w') as f:
    f.write(content)
