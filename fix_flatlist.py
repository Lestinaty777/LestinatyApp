import re

with open('/home/arch-i7/Proyects/app/src/modulos/senderos/paginas/MapaCompartido.tsx', 'r') as f:
    content = f.read()

# Add FlatList to imports if missing
if 'FlatList' not in content:
    content = content.replace("ScrollView, Pressable, Dimensions", "ScrollView, FlatList, Pressable, Dimensions")

# Fix types in renderItem
content = content.replace("renderItem={({ item: nodo, index: i }) => {", "renderItem={({ item: nodo, index: i }: { item: any; index: number }) => {")

# Remove styles.nodoWrapper or add it. I'll just remove it since it's an empty object or doesn't exist.
content = content.replace("styles.nodoWrapper,", "")

with open('/home/arch-i7/Proyects/app/src/modulos/senderos/paginas/MapaCompartido.tsx', 'w') as f:
    f.write(content)

