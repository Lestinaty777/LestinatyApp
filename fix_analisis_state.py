import re

# Update AnalisisSenderos.tsx
with open('/home/arch-i7/Proyects/app/src/modulos/senderos/paginas/AnalisisSenderos.tsx', 'r') as f:
    acode = f.read()

old_exp = "export function AnalisisSenderos({ onCategoriaChange }: { onCategoriaChange?: (id: string) => void }) {"
new_exp = "export function AnalisisSenderos({ categoriaActiva, onCategoriaChange }: { categoriaActiva: string, onCategoriaChange?: (id: string) => void }) {"
if old_exp in acode:
    acode = acode.replace(old_exp, new_exp)

old_state = "const [categoriaId, setCategoriaId] = useState<CategoriaId>('rutinas');"
new_state = "const categoriaId = (categoriaActiva as CategoriaId) || 'rutinas';"
if old_state in acode:
    acode = acode.replace(old_state, new_state)

old_sel = """  const seleccionarCategoria = (id: CategoriaId) => {
    if (id === categoriaId) return;
    hapticSeguro('seleccion');
    setCategoriaId(id);
    if (onCategoriaChange) onCategoriaChange(id);
  };"""
new_sel = """  const seleccionarCategoria = (id: CategoriaId) => {
    if (id === categoriaId) return;
    hapticSeguro('seleccion');
    if (onCategoriaChange) onCategoriaChange(id);
  };"""
if old_sel in acode:
    acode = acode.replace(old_sel, new_sel)

with open('/home/arch-i7/Proyects/app/src/modulos/senderos/paginas/AnalisisSenderos.tsx', 'w') as f:
    f.write(acode)

# Update SenderosPantalla.tsx
with open('/home/arch-i7/Proyects/app/src/modulos/senderos/pantallas/SenderosPantalla.tsx', 'r') as f:
    code = f.read()

# Pass the prop
code = code.replace("<AnalisisSenderos onCategoriaChange={setAnalisisCategoria} />", "<AnalisisSenderos categoriaActiva={analisisCategoria} onCategoriaChange={setAnalisisCategoria} />")

# Slow down the image
code = code.replace("entering={FadeIn.duration(600)}", "entering={FadeIn.duration(1200)}")

# Slow down the empty state card
code = code.replace("entering={FadeInDown.delay(500).duration(500)}", "entering={FadeInDown.delay(800).duration(700)}")

with open('/home/arch-i7/Proyects/app/src/modulos/senderos/pantallas/SenderosPantalla.tsx', 'w') as f:
    f.write(code)

