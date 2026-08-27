import re

with open('/home/arch-i7/Proyects/app/src/modulos/senderos/paginas/MapaCompartido.tsx', 'r') as f:
    content = f.read()

old_svg_logic = """          const cx1 = p1.x;
          const cy1 = p1.y + (ALTURA_PISO / 2);
          const cx2 = p2.x;
          const cy2 = p2.y - (ALTURA_PISO / 2);
          
          const d = `M ${p1.x} ${p1.y} C ${cx1} ${cy1}, ${cx2} ${cy2}, ${p2.x} ${p2.y}`;
          paths.push(
            <Path 
              key={`${nodo.id}-${destinoId}`} 
              d={d} 
              stroke="rgba(255,255,255,0.2)" 
              strokeWidth={16}
              strokeLinecap="round"
              fill="none" 
            />
          );"""

new_svg_logic = """          // Distancia para dejar hueco (Radio del nodo + padding)
          const GAP = 42; 
          
          const dx = p2.x - p1.x;
          const dy = p2.y - p1.y;
          const dist = Math.sqrt(dx*dx + dy*dy);
          
          if (dist > GAP * 2) {
            const nx = dx / dist;
            const ny = dy / dist;
            
            const startX = p1.x + nx * GAP;
            const startY = p1.y + ny * GAP;
            const endX = p2.x - nx * GAP;
            const endY = p2.y - ny * GAP;

            const cx1 = startX;
            const cy1 = startY + ((endY - startY) / 2);
            const cx2 = endX;
            const cy2 = endY - ((endY - startY) / 2);
            
            const d = `M ${startX} ${startY} C ${cx1} ${cy1}, ${cx2} ${cy2}, ${endX} ${endY}`;
            paths.push(
              <Path 
                key={`${nodo.id}-${destinoId}`} 
                d={d} 
                stroke="rgba(255,255,255,0.25)" 
                strokeWidth={12}
                strokeLinecap="round"
                fill="none" 
              />
            );
          }"""

content = content.replace(old_svg_logic, new_svg_logic)

with open('/home/arch-i7/Proyects/app/src/modulos/senderos/paginas/MapaCompartido.tsx', 'w') as f:
    f.write(content)
