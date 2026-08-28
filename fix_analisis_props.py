import re

with open('/home/arch-i7/Proyects/app/src/modulos/senderos/paginas/AnalisisSenderos.tsx', 'r') as f:
    acode = f.read()

# Fix AnalisisSenderos component export and add callback
old_exp = "export function AnalisisSenderos() {"
new_exp = "export function AnalisisSenderos({ onCategoriaChange }: { onCategoriaChange?: (id: string) => void }) {"
if old_exp in acode:
    acode = acode.replace(old_exp, new_exp)

old_sel = """  const seleccionarCategoria = (id: CategoriaId) => {
    if (id === categoriaId) return;
    hapticSeguro('seleccion');
    setCategoriaId(id);
  };"""
new_sel = """  const seleccionarCategoria = (id: CategoriaId) => {
    if (id === categoriaId) return;
    hapticSeguro('seleccion');
    setCategoriaId(id);
    if (onCategoriaChange) onCategoriaChange(id);
  };"""
if old_sel in acode:
    acode = acode.replace(old_sel, new_sel)

# Add FadeInDown to category buttons
old_map = """        {categorias.map((item) => {
          const activa = item.id === categoria.id;
          const { acento, Icono } = item;
          return (
            <Pressable key={item.id} onPress={() => seleccionarCategoria(item.id)} style={[styles.botonCategoria, activa && styles.botonCategoriaPresionado, activa && { backgroundColor: acento, borderColor: acento }]}>"""
new_map = """        {categorias.map((item, index) => {
          const activa = item.id === categoria.id;
          const { acento, Icono } = item;
          return (
            <Reanimated.View key={item.id} entering={FadeInDown.delay(index * 60).springify()} style={{ flex: 1, minWidth: 0, aspectRatio: 1 }}>
              <Pressable onPress={() => seleccionarCategoria(item.id)} style={[styles.botonCategoria, activa && styles.botonCategoriaPresionado, activa && { backgroundColor: acento, borderColor: acento }]}>"""
if old_map in acode:
    acode = acode.replace(old_map, new_map)
    acode = acode.replace("</Pressable>\n          );\n        })}", "</Pressable>\n            </Reanimated.View>\n          );\n        })}")

with open('/home/arch-i7/Proyects/app/src/modulos/senderos/paginas/AnalisisSenderos.tsx', 'w') as f:
    f.write(acode)

