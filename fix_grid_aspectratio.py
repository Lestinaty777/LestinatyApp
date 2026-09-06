import re

with open('/home/arch-i7/Proyects/app/src/modulos/inicio/pantallas/InicioPantalla.tsx', 'r') as f:
    content = f.read()

old_grid = r"\{\/\* Rejilla 7x5 \*\/\}\n\s*<View style=\{\{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: 8 \}\}>\n\s*\{mesCeldas\.map\(\(celda, i\) => \(\n\s*<View key=\{i\} style=\{\{ width: '13%', aspectRatio: 1 \}\}>"

new_grid = """{/* Rejilla 7x5 */}
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'space-between' }}>
          {mesCeldas.map((celda, i) => (
            <View key={i} style={{ width: 36, height: 36 }}>"""

content = re.sub(old_grid, new_grid, content)

with open('/home/arch-i7/Proyects/app/src/modulos/inicio/pantallas/InicioPantalla.tsx', 'w') as f:
    f.write(content)
