import re

with open('/home/arch-i7/Proyects/app/src/modulos/senderos/pantallas/SenderosPantalla.tsx', 'r') as f:
    code = f.read()

# 1. Add analisisCategoria state
old_state = "  const [sharedHeroData, setSharedHeroData] = useState<any>(null);"
new_state = "  const [sharedHeroData, setSharedHeroData] = useState<any>(null);\n  const [analisisCategoria, setAnalisisCategoria] = useState<string>('rutinas');"
code = code.replace(old_state, new_state)

# 2. Update AnalisisSenderos component prop
code = code.replace("<AnalisisSenderos />", "<AnalisisSenderos onCategoriaChange={setAnalisisCategoria} />")

# 3. Update the header mapping logic
old_logic = "  if (pestanaActiva === 'mis-senderos' && categoriaAbierta) {"
new_logic = """  const catActiva = pestanaActiva === 'mis-senderos' ? categoriaAbierta : pestanaActiva === 'activo' ? analisisCategoria : null;
  if (catActiva) {
    let mapCat = catActiva;
"""
code = code.replace(old_logic, new_logic)
code = code.replace("if (categoriaAbierta === 'rutinas') {", "if (mapCat === 'rutinas') {")
code = code.replace("} else if (categoriaAbierta === 'salud') {", "} else if (mapCat === 'salud') {")
code = code.replace("} else if (categoriaAbierta === 'habitos') {", "} else if (mapCat === 'habitos') {")
code = code.replace("} else if (categoriaAbierta === 'tareas') {", "} else if (mapCat === 'tareas') {")
code = code.replace("} else if (categoriaAbierta === 'finanzas') {", "} else if (mapCat === 'finanzas') {")
code = code.replace("} else if (categoriaAbierta === 'relaciones') {", "} else if (mapCat === 'relaciones') {")
code = code.replace("} else if (categoriaAbierta === 'estudio') {", "} else if (mapCat === 'estudio') {")

old_icon_find = "  const catInfo = categoriasCarpeta.find(c => c.id === categoriaAbierta);"
new_icon_find = "  const catInfo = categoriasCarpeta.find(c => c.id === catActiva);"
code = code.replace(old_icon_find, new_icon_find)

# 4. Hide empty state if pestana is activo (since Analisis renders its own stuff, wait! The user said "el mensaje de aun no tienes senderos ese hacerlo variable para cada tab activo por ejemplo analisis/tareas y muestra un mensaje distinto".
# If they want to see the empty state card in Analisis, we keep it! It will naturally show the mapped title and subtitle.)

with open('/home/arch-i7/Proyects/app/src/modulos/senderos/pantallas/SenderosPantalla.tsx', 'w') as f:
    f.write(code)

