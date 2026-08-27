import re

with open('/home/arch-i7/Proyects/app/src/modulos/senderos/paginas/MapaCompartido.tsx', 'r') as f:
    content = f.read()

# 1. Fix the path logic where I destroyed p1.x
old_path_broken_1 = "const dx = p2.x - CENTER_X + nodo.offsetX;"
new_path_1 = "const dx = p2.x - p1.x;"
content = content.replace(old_path_broken_1, new_path_1)

old_path_broken_2 = "const startX = CENTER_X + nodo.offsetX + nx * GAP;"
new_path_2 = "const startX = p1.x + nx * GAP;"
content = content.replace(old_path_broken_2, new_path_2)

# 2. Fix the Tooltip boundary math
old_tooltip_broken_1 = "const leftEdge = CENTER_X + nodo.offsetX - (TOOLTIP_WIDTH / 2);"
new_tooltip_1 = "const leftEdge = x - (TOOLTIP_WIDTH / 2);"
content = content.replace(old_tooltip_broken_1, new_tooltip_1)

old_tooltip_broken_2 = "const rightEdge = CENTER_X + nodo.offsetX + (TOOLTIP_WIDTH / 2);"
new_tooltip_2 = "const rightEdge = x + (TOOLTIP_WIDTH / 2);"
content = content.replace(old_tooltip_broken_2, new_tooltip_2)

# Wait, the node renderer has:
# left: CENTER_X + nodo.offsetX - 35, // 35 es la mitad del ancho del SVG (70)
# But earlier I said `left: x - 35,` was already replaced?
# Let's check what it has currently.
# In my previous grep it showed: `left: CENTER_X + nodo.offsetX - 35`
# That is correct, we can leave it or change to `left: x - 35`. 
# Wait, `x` is `CENTER_X + nodo.offsetX`, so it doesn't matter.

with open('/home/arch-i7/Proyects/app/src/modulos/senderos/paginas/MapaCompartido.tsx', 'w') as f:
    f.write(content)
