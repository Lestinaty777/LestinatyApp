import re

with open('/home/arch-i7/Proyects/app/src/modulos/inicio/pantallas/InicioPantalla.tsx', 'r') as f:
    content = f.read()

# Fix Book badge
old_book = r"<View style=\{\{ width: 42, height: 42, borderRadius: 8, backgroundColor: '#4A8BB3', borderBottomWidth: 4, borderBottomColor: oscurecer\('#4A8BB3', 0\.6\), justifyContent: 'center', alignItems: 'center' \}\}>\n\s*<BookOpen color=\"#FFFFFF\" size=\{24\} fill=\"#FFFFFF\" \/>\n\s*<\/View>"
new_book = """<View style={{ width: 42, height: 42 }}>
                        <View style={{ position: 'absolute', top: 4, left: 0, right: 0, bottom: -4, backgroundColor: oscurecer('#4A8BB3', 0.6), borderRadius: 8 }} />
                        <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: '#4A8BB3', borderRadius: 8, justifyContent: 'center', alignItems: 'center' }}>
                          <BookOpen color="#FFFFFF" size={24} fill="#FFFFFF" />
                        </View>
                      </View>"""
content = re.sub(old_book, new_book, content)


# Fix Flame badge
old_flame = r"<View style=\{\{ width: 42, height: 42, borderRadius: 8, backgroundColor: '#F26D21', borderBottomWidth: 4, borderBottomColor: oscurecer\('#F26D21', 0\.6\), justifyContent: 'center', alignItems: 'center' \}\}>\n\s*<Flame color=\"#FFFFFF\" size=\{24\} fill=\"#FFFFFF\" \/>\n\s*<\/View>"
new_flame = """<View style={{ width: 42, height: 42 }}>
            <View style={{ position: 'absolute', top: 4, left: 0, right: 0, bottom: -4, backgroundColor: oscurecer('#F26D21', 0.6), borderRadius: 8 }} />
            <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: '#F26D21', borderRadius: 8, justifyContent: 'center', alignItems: 'center' }}>
              <Flame color="#FFFFFF" size={24} fill="#FFFFFF" />
            </View>
          </View>"""
content = re.sub(old_flame, new_flame, content)

with open('/home/arch-i7/Proyects/app/src/modulos/inicio/pantallas/InicioPantalla.tsx', 'w') as f:
    f.write(content)
