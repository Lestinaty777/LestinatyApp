import re

with open('/home/arch-i7/Proyects/app/src/modulos/senderos/paginas/MapaCompartido.tsx', 'r') as f:
    content = f.read()

# 1. Reduce GAP to 32 to guarantee the line is visible, and set color logic
old_logic = """          // Distancia para dejar hueco (Radio del nodo + padding)
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

new_logic = """          // Distancia para dejar hueco (Radio del nodo = 35, padding = 4)
          const GAP = 35; 
          
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
            
            // Logica de colores: Si el origen es < 2, ya lo pasamos. El destino es nivel+1.
            // Asi que nivel 0 a 1 -> completado, 1 a 2 -> completado. 2 a 3 -> inactivo (gris).
            const isCompletedPath = nodo.nivel < 2;
            const colorLinea = isCompletedPath ? masterColor : 'rgba(255,255,255,0.15)';
            
            paths.push(
              <Path 
                key={`${nodo.id}-${destinoId}`} 
                d={d} 
                stroke={colorLinea}
                strokeWidth={12}
                strokeLinecap="round"
                fill="none" 
              />
            );
          }"""

content = content.replace(old_logic, new_logic)

with open('/home/arch-i7/Proyects/app/src/modulos/senderos/paginas/MapaCompartido.tsx', 'w') as f:
    f.write(content)

