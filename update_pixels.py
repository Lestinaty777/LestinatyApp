import re

with open('/home/arch-i7/Proyects/app/src/modulos/inicio/pantallas/InicioPantalla.tsx', 'r') as f:
    content = f.read()

pixel_old = """const PIXEL_SIZE = 12;
const GRID_SIZE = 6; // 6x6 = 36 pixeles
const PATTERN_SIZE = PIXEL_SIZE * GRID_SIZE; // 72

// Generamos la opacidad fija para evitar subpixeles o blur
const patternPixels = Array.from({ length: GRID_SIZE * GRID_SIZE }).map((_, i) => {
  const x = (i % GRID_SIZE) * PIXEL_SIZE;
  const y = Math.floor(i / GRID_SIZE) * PIXEL_SIZE;
  const isLight = Math.random() > 0.5;
  // Usamos pasos discretos para la opacidad (0.05, 0.1, 0.15, 0.2)
  const opacity = Math.floor(Math.random() * 4 + 1) * 0.05; 
  return { x, y, fill: isLight ? '#FFFFFF' : '#000000', opacity };
});"""

pixel_new = """const PIXEL_SIZE = 4;
const GRID_SIZE = 16; // 16x16 = 256 pixeles por patron
const PATTERN_SIZE = PIXEL_SIZE * GRID_SIZE; // 64

const patternPixels = Array.from({ length: GRID_SIZE * GRID_SIZE }).map((_, i) => {
  const x = (i % GRID_SIZE) * PIXEL_SIZE;
  const y = Math.floor(i / GRID_SIZE) * PIXEL_SIZE;
  // 50% de probabilidad de ser claro/oscuro
  const isLight = Math.random() > 0.5;
  // Devolvemos más variabilidad, usando aleatoriedad sin redondear tanto para textura rica
  const opacity = Math.random() * 0.12; 
  return { x, y, fill: isLight ? '#FFFFFF' : '#000000', opacity };
});"""

content = content.replace(pixel_old, pixel_new)

with open('/home/arch-i7/Proyects/app/src/modulos/inicio/pantallas/InicioPantalla.tsx', 'w') as f:
    f.write(content)

