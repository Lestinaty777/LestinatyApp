import re

with open('/home/arch-i7/Proyects/app/src/modulos/inicio/pantallas/InicioPantalla.tsx', 'r') as f:
    content = f.read()

# Fix pointer events
content = re.sub(r"pointerEvents=\{menuAbierto \? 'auto' : 'none'\}", "pointerEvents={activeMenu !== 'none' ? 'auto' : 'none'}", content)

# Wrap ScrollView
content = content.replace("<ScrollView horizontal showsHorizontalScrollIndicator={false} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20, gap: 15, paddingBottom: 15, paddingTop: 5 }}>", "{activeMenu === 'courses' && (\n              <ScrollView horizontal showsHorizontalScrollIndicator={false} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20, gap: 15, paddingBottom: 15, paddingTop: 5 }}>")

content = content.replace("</ScrollView>\n            </Animated.View>", "</ScrollView>\n              )}\n              {activeMenu === 'calendar' && <PanelRacha />}\n            </Animated.View>")

with open('/home/arch-i7/Proyects/app/src/modulos/inicio/pantallas/InicioPantalla.tsx', 'w') as f:
    f.write(content)
