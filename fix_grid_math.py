import re

with open('/home/arch-i7/Proyects/app/src/modulos/inicio/pantallas/InicioPantalla.tsx', 'r') as f:
    content = f.read()

# Fix useWindowDimensions
content = content.replace("const { height } = useWindowDimensions();", "const { height, width: windowWidth } = useWindowDimensions();")

# Replace ticket dynamic sizing logic to support symmetric grid
old_math = """                  const h = 85;
                  // Cálculo dinámico del ancho basado en la longitud del texto
                  const bodyWidth = Math.min(220, Math.max(95, 16 + (asig.titulo.length * 8.2) + 10));
                  const w = bodyWidth + 45; // 45px es el ancho fijo del talón (stub)
                  
                  const cutoutStart = bodyWidth;
                  const cutoutEnd = bodyWidth + 16;
                  const dashX = bodyWidth + 8;
                  
                  const path = `M 0,0 L ${cutoutStart},0 A 8,8 0 0,0 ${cutoutEnd},0 L ${w},0 L ${w},${h} L ${cutoutEnd},${h} A 8,8 0 0,0 ${cutoutStart},${h} L 0,${h} Z`;"""

new_math = """                  const h = 85;
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

content = content.replace(old_math, new_math)

# Fix extraHeight calculation to account for strict wrapping
old_height = "const alturaExpandida = filas === 1 ? 115 : (filas * 89) + ((filas - 1) * 15) + 20;"
new_height = "const alturaExpandida = filas === 1 ? 115 : (filas * 89) + ((filas - 1) * 15) + 40;"
content = content.replace(old_height, new_height)

# Set ScrollView contentContainerStyle paddingBottom slightly higher to avoid clipping the bottom shadow
old_scroll = "esGrid ? { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', paddingHorizontal: 20, gap: 15, paddingBottom: 15, paddingTop: 5 } : { paddingHorizontal: 20, gap: 15, paddingBottom: 15, paddingTop: 5 }"
new_scroll = "esGrid ? { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', paddingHorizontal: 20, gap: 15, paddingBottom: 35, paddingTop: 5 } : { paddingHorizontal: 20, gap: 15, paddingBottom: 15, paddingTop: 5 }"
content = content.replace(old_scroll, new_scroll)


with open('/home/arch-i7/Proyects/app/src/modulos/inicio/pantallas/InicioPantalla.tsx', 'w') as f:
    f.write(content)
