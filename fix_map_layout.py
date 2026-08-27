import re

with open('/home/arch-i7/Proyects/app/src/modulos/senderos/paginas/MapaCompartido.tsx', 'r') as f:
    content = f.read()

# 1. Decrease separation and adjust frequency/amplitude
content = content.replace('const ALTURA_PISO = 140;', 'const ALTURA_PISO = 90;')
content = content.replace('const AMPLITUD = 80;', 'const AMPLITUD = 55;')
content = content.replace('const FRECUENCIA = 0.8;', 'const FRECUENCIA = 0.9;')

# 2. Start from top to bottom
old_y_calc = "const y = totalHeight - MAPA_PADDING_BOTTOM - (nodo.nivel * ALTURA_PISO);"
new_y_calc = "const y = MAPA_PADDING_TOP + (nodo.nivel * ALTURA_PISO);"
content = content.replace(old_y_calc, new_y_calc)

# Fix bezier curve directions since we are now flowing downwards (top to bottom)
# p1 is higher up (smaller Y), p2 is lower down (larger Y)
# We want the control points to extend vertically downwards from p1 and upwards from p2
old_bezier = """          const cx1 = p1.x;
          const cy1 = p1.y - (ALTURA_PISO / 2.5);
          const cx2 = p2.x;
          const cy2 = p2.y + (ALTURA_PISO / 2.5);"""

new_bezier = """          const cx1 = p1.x;
          const cy1 = p1.y + (ALTURA_PISO / 2);
          const cx2 = p2.x;
          const cy2 = p2.y - (ALTURA_PISO / 2);"""
content = content.replace(old_bezier, new_bezier)

# 3. Remove the heavy white variation
old_variacion = "const variacion = (nodo.nivel * 10) - 20;"
new_variacion = "const variacion = 0; // Usar el masterColor puro"
content = content.replace(old_variacion, new_variacion)

with open('/home/arch-i7/Proyects/app/src/modulos/senderos/paginas/MapaCompartido.tsx', 'w') as f:
    f.write(content)
