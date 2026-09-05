import re

with open('/home/arch-i7/Proyects/app/src/modulos/inicio/pantallas/InicioPantalla.tsx', 'r') as f:
    content = f.read()

# Reemplazar la definición estática de "w" y "h" y "path" con la lógica dinámica
old_math = """                  const w = 140;
                  const h = 85;
                  const path = `M 0,0 L 95,0 A 8,8 0 0,0 111,0 L ${w},0 L ${w},${h} L 111,${h} A 8,8 0 0,0 95,${h} L 0,${h} Z`;"""

new_math = """                  const h = 85;
                  // Cálculo dinámico del ancho basado en la longitud del texto
                  const bodyWidth = Math.max(95, 16 + (asig.titulo.length * 8.2) + 10);
                  const w = bodyWidth + 45; // 45px es el ancho fijo del talón (stub)
                  
                  const cutoutStart = bodyWidth;
                  const cutoutEnd = bodyWidth + 16;
                  const dashX = bodyWidth + 8;
                  
                  const path = `M 0,0 L ${cutoutStart},0 A 8,8 0 0,0 ${cutoutEnd},0 L ${w},0 L ${w},${h} L ${cutoutEnd},${h} A 8,8 0 0,0 ${cutoutStart},${h} L 0,${h} Z`;"""
content = content.replace(old_math, new_math)

# Reemplazar la línea punteada para usar dashX dinámico
old_line = """<Line x1="103" y1="12" x2="103" y2={h - 12} stroke="rgba(255,255,255,0.4)" strokeWidth="1.5" strokeDasharray="3 3" />"""
new_line = """<Line x1={dashX} y1="12" x2={dashX} y2={h - 12} stroke="rgba(255,255,255,0.4)" strokeWidth="1.5" strokeDasharray="3 3" />"""
content = content.replace(old_line, new_line)

# Reemplazar las posiciones del código de barras en el stub
old_barcode = """                                {/* Simulación de Código de Barras en el Stub (Derecha) */}
                                <Rect x="118" y="25" width="2" height="35" fill="rgba(255,255,255,0.6)" />
                                <Rect x="122" y="25" width="4" height="35" fill="rgba(255,255,255,0.6)" />
                                <Rect x="128" y="25" width="1" height="35" fill="rgba(255,255,255,0.6)" />
                                <Rect x="131" y="25" width="3" height="35" fill="rgba(255,255,255,0.6)" />"""

new_barcode = """                                {/* Simulación de Código de Barras en el Stub (Derecha) */}
                                <Rect x={dashX + 15} y="25" width="2" height="35" fill="rgba(255,255,255,0.6)" />
                                <Rect x={dashX + 19} y="25" width="4" height="35" fill="rgba(255,255,255,0.6)" />
                                <Rect x={dashX + 25} y="25" width="1" height="35" fill="rgba(255,255,255,0.6)" />
                                <Rect x={dashX + 28} y="25" width="3" height="35" fill="rgba(255,255,255,0.6)" />"""
content = content.replace(old_barcode, new_barcode)

# Asegurar que el título esté en una sola línea
old_title = """<Texto style={[styles.textoCarruselTitulo, { fontSize: 13, lineHeight: 14 }]}>{asig.titulo}</Texto>"""
new_title = """<Texto style={[styles.textoCarruselTitulo, { fontSize: 13, lineHeight: 14 }]} numberOfLines={1}>{asig.titulo}</Texto>"""
content = content.replace(old_title, new_title)

# Expandir la máscara de pixel art dinámicamente
old_mask = """<View style={{ position: 'absolute', left: 0, top: 0, width: 103, height: h, overflow: 'hidden', opacity: 0.3 }} pointerEvents="none">"""
new_mask = """<View style={{ position: 'absolute', left: 0, top: 0, width: dashX, height: h, overflow: 'hidden', opacity: 0.3 }} pointerEvents="none">"""
content = content.replace(old_mask, new_mask)


with open('/home/arch-i7/Proyects/app/src/modulos/inicio/pantallas/InicioPantalla.tsx', 'w') as f:
    f.write(content)
