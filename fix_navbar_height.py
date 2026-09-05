import re

with open('/home/arch-i7/Proyects/app/src/modulos/inicio/pantallas/InicioPantalla.tsx', 'r') as f:
    content = f.read()

# Reduce expansion height
old_anim = """      height: 62 + 140 * animMenu.value,"""
new_anim = """      height: 62 + 115 * animMenu.value,"""
content = content.replace(old_anim, new_anim)

# Reduce vertical padding in the scrollview
old_scroll = """<ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20, gap: 15, paddingBottom: 20, paddingTop: 10 }}>"""
new_scroll = """<ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20, gap: 15, paddingBottom: 15, paddingTop: 5 }}>"""
content = content.replace(old_scroll, new_scroll)

with open('/home/arch-i7/Proyects/app/src/modulos/inicio/pantallas/InicioPantalla.tsx', 'w') as f:
    f.write(content)
