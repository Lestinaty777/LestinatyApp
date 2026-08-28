import re

with open('/home/arch-i7/Proyects/app/src/modulos/senderos/pantallas/SenderosPantalla.tsx', 'r') as f:
    code = f.read()

# Replace the title text in sharedHeroData block
old_title = "<Texto style={[styles.estadoTitulo, { color: sharedHeroData.acento }]}>{sharedHeroData.titulo}</Texto>"
new_title = """<View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  {React.createElement(categoriasCarpeta.find(c => c.id === sharedHeroData.categoriaId)?.Icono || Compass, { color: sharedHeroData.acento, size: 14, strokeWidth: 3 })}
                  <Texto style={[styles.estadoTitulo, { color: sharedHeroData.acento, flex: 1, marginTop: 0 }]} numberOfLines={1}>{sharedHeroData.titulo}</Texto>
                </View>"""
code = code.replace(old_title, new_title)

# Ensure Compass and React are available if needed. (React is usually imported or JSX works, Compass is already imported from lucide)
with open('/home/arch-i7/Proyects/app/src/modulos/senderos/pantallas/SenderosPantalla.tsx', 'w') as f:
    f.write(code)

