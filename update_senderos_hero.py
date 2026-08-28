import re

with open('/home/arch-i7/Proyects/app/src/modulos/senderos/pantallas/SenderosPantalla.tsx', 'r') as f:
    code = f.read()

# 1. Add analisisCategoria to state
old_state = "  const [sharedHeroData, setSharedHeroData] = useState<any>(null);"
new_state = "  const [sharedHeroData, setSharedHeroData] = useState<any>(null);\n  const [analisisCategoria, setAnalisisCategoria] = useState<string>('rutinas');"
code = code.replace(old_state, new_state)

# 2. Add prop to AnalisisSenderos call
old_analisis = "<AnalisisSenderos />"
new_analisis = "<AnalisisSenderos onCategoriaChange={setAnalisisCategoria} />"
code = code.replace(old_analisis, new_analisis)

# 3. Update the dynamic mapping to use catActiva
old_logic = "  if (pestanaActiva === 'mis-senderos' && categoriaAbierta) {"
new_logic = """  const catActiva = pestanaActiva === 'mis-senderos' ? categoriaAbierta : pestanaActiva === 'analisis' ? analisisCategoria : null;
  if (catActiva) {"""
code = code.replace(old_logic, new_logic)

# Replace 'categoriaAbierta ===' with 'catActiva ===' inside the block
code = code.replace("if (categoriaAbierta === 'rutinas') {", "if (catActiva === 'rutinas') {")
code = code.replace("else if (categoriaAbierta === 'salud') {", "else if (catActiva === 'salud') {")
code = code.replace("else if (categoriaAbierta === 'habitos') {", "else if (catActiva === 'habitos') {")
code = code.replace("else if (categoriaAbierta === 'tareas') {", "else if (catActiva === 'tareas') {")
code = code.replace("else if (categoriaAbierta === 'finanzas') {", "else if (catActiva === 'finanzas') {")
code = code.replace("else if (categoriaAbierta === 'relaciones') {", "else if (catActiva === 'relaciones') {")
code = code.replace("else if (categoriaAbierta === 'estudio') {", "else if (catActiva === 'estudio') {")

# Update icon mapping
old_icon_map = "const catInfo = categoriasCarpeta.find(c => c.id === categoriaAbierta);"
new_icon_map = "const catInfo = categoriasCarpeta.find(c => c.id === catActiva);"
code = code.replace(old_icon_map, new_icon_map)

# We must ensure that we don't accidentally hide the empty state card for 'analisis'.
# Currently, it is hidden if (pestanaActiva === 'compartidos' && sharedHeroData). So for 'analisis' it will render the else branch, which is the standard empty state. Perfect!

with open('/home/arch-i7/Proyects/app/src/modulos/senderos/pantallas/SenderosPantalla.tsx', 'w') as f:
    f.write(code)

