import re

with open('/home/arch-i7/Proyects/app/src/modulos/senderos/paginas/MapaCompartido.tsx', 'r') as f:
    content = f.read()

# Replace the layout generation and types
old_layout_block = """type TipoCarril = -1 | 0 | 1;
type TipoNodoMapa = 'normal' | 'tablero' | 'meta';

interface NodoDef {
  id: string;
  nivel: number;
  carril: TipoCarril;
  tipo: TipoNodoMapa;
  conexiones: string[]; // Hacia donde fluye (niveles superiores)
}

const LAYOUT_MAPA: NodoDef[] = [
  { id: 'n0', nivel: 0, carril: 0, tipo: 'normal', conexiones: ['n1-izq', 'n1-cen', 'n1-der'] },
  { id: 'n1-izq', nivel: 1, carril: -1, tipo: 'normal', conexiones: ['n2-izq'] },
  { id: 'n1-cen', nivel: 1, carril: 0, tipo: 'normal', conexiones: ['n2-cen'] },
  { id: 'n1-der', nivel: 1, carril: 1, tipo: 'normal', conexiones: ['n2-der'] },
  { id: 'n2-izq', nivel: 2, carril: -1, tipo: 'normal', conexiones: ['tablero'] },
  { id: 'n2-cen', nivel: 2, carril: 0, tipo: 'normal', conexiones: ['tablero'] },
  { id: 'n2-der', nivel: 2, carril: 1, tipo: 'normal', conexiones: ['tablero'] },
  { id: 'tablero', nivel: 3, carril: 0, tipo: 'tablero', conexiones: ['meta'] },
  { id: 'meta', nivel: 4, carril: 0, tipo: 'meta', conexiones: [] },
];"""

new_layout_block = """type TipoNodoMapa = 'normal' | 'tablero' | 'meta';

interface NodoDef {
  id: string;
  nivel: number;
  tipo: TipoNodoMapa;
  offsetX: number; // Pixeles de desviacion del centro
  conexiones: string[]; 
}

// Generador de layout estilo Serpiente (Duolingo)
const TOTAL_NODOS = 12;
const AMPLITUD = 80; // Cuanto se desvia a los lados
const FRECUENCIA = 0.8; // Que tan rapido oscila

const LAYOUT_MAPA: NodoDef[] = Array.from({ length: TOTAL_NODOS }).map((_, i) => {
  const isTablero = i === 6; // El tablero es un punto medio
  const isMeta = i === TOTAL_NODOS - 1;
  const tipo = isMeta ? 'meta' : isTablero ? 'tablero' : 'normal';
  
  // Nodos especiales (tablero o meta) van al centro. Nodos normales serpentean.
  const offsetX = (tipo === 'tablero' || tipo === 'meta') 
    ? 0 
    : Math.sin(i * FRECUENCIA) * AMPLITUD;

  return {
    id: `nodo-${i}`,
    nivel: i,
    tipo,
    offsetX,
    conexiones: i < TOTAL_NODOS - 1 ? [`nodo-${i + 1}`] : [],
  };
});"""

content = content.replace(old_layout_block, new_layout_block)

# Fix the coordinates calculator
old_coords = """  // Calculadora de Coordenadas
  const obtenerCoordenadas = (nodo: NodoDef) => {
    const x = CENTER_X + (nodo.carril * ANCHO_CARRIL);
    // Y va de abajo hacia arriba (nivel 0 es abajo)
    const y = totalHeight - MAPA_PADDING_BOTTOM - (nodo.nivel * ALTURA_PISO);
    return { x, y };
  };"""

new_coords = """  // Calculadora de Coordenadas
  const obtenerCoordenadas = (nodo: NodoDef) => {
    const x = CENTER_X + nodo.offsetX;
    // Y va de abajo hacia arriba (nivel 0 es abajo)
    const y = totalHeight - MAPA_PADDING_BOTTOM - (nodo.nivel * ALTURA_PISO);
    return { x, y };
  };"""

content = content.replace(old_coords, new_coords)

# Fix the dummy avatars
old_avatars = """          {/* EJEMPLO DE AVATARES FLOTANTES (Fichas) */}
          <View style={[styles.fichaAvatar, { left: coordsDict['n1-izq'].x - 12, top: coordsDict['n1-izq'].y - 20, backgroundColor: '#34D946' }]}>
             <Texto style={styles.fichaTexto}>YO</Texto>
          </View>
          <View style={[styles.fichaAvatar, { left: coordsDict['n2-der'].x - 12, top: coordsDict['n2-der'].y - 20, backgroundColor: '#FF8A00' }]}>
             <Texto style={styles.fichaTexto}>CA</Texto>
          </View>"""

new_avatars = """          {/* EJEMPLO DE AVATARES FLOTANTES (Fichas) */}
          <View style={[styles.fichaAvatar, { left: coordsDict['nodo-2'].x - 12, top: coordsDict['nodo-2'].y - 20, backgroundColor: '#34D946' }]}>
             <Texto style={styles.fichaTexto}>YO</Texto>
          </View>
          <View style={[styles.fichaAvatar, { left: coordsDict['nodo-2'].x + 5, top: coordsDict['nodo-2'].y - 10, backgroundColor: '#FF8A00' }]}>
             <Texto style={styles.fichaTexto}>CA</Texto>
          </View>"""

content = content.replace(old_avatars, new_avatars)

# We want the stroke of the path to look like a thick connected track.
old_path = """            <Path 
              key={`${nodo.id}-${destinoId}`} 
              d={d} 
              stroke="rgba(255,255,255,0.15)" 
              strokeWidth={8}
              strokeLinecap="round"
              fill="none" 
            />"""

new_path = """            <Path 
              key={`${nodo.id}-${destinoId}`} 
              d={d} 
              stroke="rgba(255,255,255,0.2)" 
              strokeWidth={16}
              strokeLinecap="round"
              fill="none" 
            />"""

content = content.replace(old_path, new_path)

with open('/home/arch-i7/Proyects/app/src/modulos/senderos/paginas/MapaCompartido.tsx', 'w') as f:
    f.write(content)

