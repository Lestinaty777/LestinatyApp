import re

with open('/home/arch-i7/Proyects/app/src/modulos/inicio/pantallas/InicioPantalla.tsx', 'r') as f:
    content = f.read()

# Remove esGrid logic
old_esgrid = """  const esGrid = ASIGNATURAS.length > 4;
  const filas = esGrid ? Math.ceil(ASIGNATURAS.length / 2) : 1;
  const alturaExpandida = filas === 1 ? 115 : (filas * 89) + ((filas - 1) * 15) + 40;"""
content = content.replace(old_esgrid, "")

# Revert height
old_height = """  const animNavbarEstilos = useAnimatedStyle(() => ({
    height: 62 + alturaExpandida * animMenu.value,
  }));"""
new_height = """  const animNavbarEstilos = useAnimatedStyle(() => ({
    height: 62 + 115 * animMenu.value,
  }));"""
content = content.replace(old_height, new_height)

# Revert ScrollView
old_scroll = """<ScrollView horizontal={!esGrid} showsHorizontalScrollIndicator={false} showsVerticalScrollIndicator={false} contentContainerStyle={esGrid ? { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', paddingHorizontal: 20, gap: 15, paddingBottom: 35, paddingTop: 5 } : { paddingHorizontal: 20, gap: 15, paddingBottom: 15, paddingTop: 5 }}>"""
new_scroll = """<ScrollView horizontal showsHorizontalScrollIndicator={false} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20, gap: 15, paddingBottom: 15, paddingTop: 5 }}>"""
content = content.replace(old_scroll, new_scroll)

# Revert math logic
old_math = """                  const h = 85;
                  let w, bodyWidth, cutoutStart, cutoutEnd, dashX, path;
                  
                  if (esGrid) {
                    // Grid Mode: Forzar anchos simétricos exactos para alinear 2 columnas
                    w = (windowWidth - 40 - 15) / 2;
                    bodyWidth = w - 45;
                  } else {
                    // Scroll Mode: Ancho dinámico
                    bodyWidth = Math.min(220, Math.max(95, 16 + (asig.titulo.length * 8.2) + 10));
                    w = bodyWidth + 45;
                  }
                  
                  cutoutStart = bodyWidth;
                  cutoutEnd = bodyWidth + 16;
                  dashX = bodyWidth + 8;
                  
                  path = `M 0,0 L ${cutoutStart},0 A 8,8 0 0,0 ${cutoutEnd},0 L ${w},0 L ${w},${h} L ${cutoutEnd},${h} A 8,8 0 0,0 ${cutoutStart},${h} L 0,${h} Z`;"""

new_math = """                  const h = 85;
                  // Scroll Mode: Ancho dinámico
                  const bodyWidth = Math.min(220, Math.max(95, 16 + (asig.titulo.length * 8.2) + 10));
                  const w = bodyWidth + 45;
                  
                  const cutoutStart = bodyWidth;
                  const cutoutEnd = bodyWidth + 16;
                  const dashX = bodyWidth + 8;
                  
                  const path = `M 0,0 L ${cutoutStart},0 A 8,8 0 0,0 ${cutoutEnd},0 L ${w},0 L ${w},${h} L ${cutoutEnd},${h} A 8,8 0 0,0 ${cutoutStart},${h} L 0,${h} Z`;"""
content = content.replace(old_math, new_math)


with open('/home/arch-i7/Proyects/app/src/modulos/inicio/pantallas/InicioPantalla.tsx', 'w') as f:
    f.write(content)
