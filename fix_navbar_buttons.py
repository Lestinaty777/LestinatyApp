import re

with open('/home/arch-i7/Proyects/app/src/modulos/inicio/pantallas/InicioPantalla.tsx', 'r') as f:
    content = f.read()

# Reemplazar los dos primeros BotonTab
old_botones = r"<BotonTab onPress=\{\(\) => handleToggleMenu\('courses'\)\}.+?<\/BotonTab>\n\s*<BotonTab onPress=\{\(\) => handleToggleMenu\('calendar'\)\}.+?<\/BotonTab>"

new_botones = """<BotonTab onPress={() => handleToggleMenu('courses')}>
                <View style={[{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12, gap: 6 }, activeMenu === 'courses' && { backgroundColor: 'rgba(0,0,0,0.05)' }]}>
                  <BookOpen color={activeMenu === 'courses' ? '#4A8BB3' : '#76736D'} size={20} />
                  <Texto style={{ fontSize: 14, fontFamily: 'Montserrat-Bold', color: activeMenu === 'courses' ? '#111111' : '#76736D', marginTop: -2 }}>{ASIGNATURAS.length}</Texto>
                </View>
              </BotonTab>
              <BotonTab onPress={() => handleToggleMenu('calendar')}>
                <View style={[{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12, gap: 6 }, activeMenu === 'calendar' && { backgroundColor: 'rgba(242, 109, 33, 0.1)' }]}>
                  <Flame color={activeMenu === 'calendar' ? '#F26D21' : '#76736D'} size={20} fill={activeMenu === 'calendar' ? '#F26D21' : 'transparent'} />
                  <Texto style={{ fontSize: 14, fontFamily: 'Montserrat-Bold', color: activeMenu === 'calendar' ? '#F26D21' : '#76736D', marginTop: -2 }}>3</Texto>
                </View>
              </BotonTab>"""

content = re.sub(old_botones, new_botones, content, flags=re.DOTALL)

with open('/home/arch-i7/Proyects/app/src/modulos/inicio/pantallas/InicioPantalla.tsx', 'w') as f:
    f.write(content)
