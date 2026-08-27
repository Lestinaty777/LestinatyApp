import re

with open('/home/arch-i7/Proyects/app/src/diseno/componentes/Nodo.tsx', 'r') as f:
    nodo_code = f.read()

# Add imports
if 'RecuadroGlass' not in nodo_code:
    nodo_code = nodo_code.replace("import { Texto } from './Texto';", "import { Texto } from './Texto';\nimport { RecuadroGlass } from './RecuadroGlass';\nimport { BarraProgresoLiquida } from './BarraProgresoLiquida';")

# Add types
old_props = """interface NodoProps {
  Icono: LucideIcon;
  masterColor: string;
  onPress?: () => void;
  size?: number;
  variacion?: number;
  isSelected?: boolean;
  tituloTooltip?: string;
  descripcionTooltip?: string;
}"""

new_props = """export type EstadoNodo = 'activo' | 'completado' | 'desactivado';

interface NodoProps {
  Icono: LucideIcon;
  masterColor: string;
  onPress?: () => void;
  size?: number;
  variacion?: number;
  isSelected?: boolean;
  tituloTooltip?: string;
  descripcionTooltip?: string;
  progresoTooltip?: number;
  estado?: EstadoNodo;
}"""

nodo_code = nodo_code.replace(old_props, new_props)

# Update destructure
old_destructure = """export function Nodo({
  Icono,
  masterColor,
  onPress,
  size = 60,
  variacion = 0,
  isSelected = false,
  tituloTooltip = 'Misión',
  descripcionTooltip = 'Haz clic aquí para comenzar esta etapa del recorrido.',
}: NodoProps) {"""

new_destructure = """export function Nodo({
  Icono,
  masterColor,
  onPress,
  size = 60,
  variacion = 0,
  isSelected = false,
  tituloTooltip = 'Misión',
  descripcionTooltip = 'Haz clic aquí para comenzar esta etapa del recorrido.',
  progresoTooltip,
  estado = 'activo',
}: NodoProps) {"""

nodo_code = nodo_code.replace(old_destructure, new_destructure)

# Update Color Logic
old_color_logic = "  const colorFinal = ajustarColor(masterColor, variacion);"
new_color_logic = """  let colorBase = masterColor;
  if (estado === 'desactivado') {
    colorBase = '#A0A0A5'; // Grisaceo
  } else if (estado === 'completado') {
    colorBase = ajustarColor(masterColor, 15); // Mas saturado/luminoso
  }
  
  const colorFinal = ajustarColor(colorBase, variacion);"""
nodo_code = nodo_code.replace(old_color_logic, new_color_logic)

# Update Tooltip render
old_tooltip = """        <View style={styles.tooltipPosicionador}>
          <View style={styles.tooltipCaja}>
            <Texto style={styles.tooltipTitulo}>{tituloTooltip}</Texto>
            <Texto style={styles.tooltipDesc}>{descripcionTooltip}</Texto>
            <Pressable 
              style={({ pressed }) => [styles.tooltipBoton, { backgroundColor: masterColor, opacity: pressed ? 0.8 : 1 }]} 
              onPress={() => hapticSeguro()}
            >
              <Texto style={styles.tooltipBotonTexto}>EMPEZAR</Texto>
            </Pressable>
          </View>
          <View style={styles.tooltipFlechaWrapper}>
            <View style={styles.tooltipFlecha} />
          </View>
        </View>"""

new_tooltip = """        <View style={styles.tooltipPosicionador}>
          <RecuadroGlass style={styles.tooltipCaja}>
            <Texto style={styles.tooltipTitulo}>{tituloTooltip}</Texto>
            <Texto style={styles.tooltipDesc}>{descripcionTooltip}</Texto>
            
            {progresoTooltip !== undefined && (
               <View style={{ width: '100%', marginBottom: 12 }}>
                 <BarraProgresoLiquida porcentaje={progresoTooltip} color={masterColor} />
               </View>
            )}

            <Pressable 
              style={({ pressed }) => [styles.tooltipBoton, { backgroundColor: masterColor, opacity: pressed ? 0.8 : 1 }]} 
              onPress={() => hapticSeguro()}
            >
              <Texto style={styles.tooltipBotonTexto}>
                {estado === 'completado' ? 'REVISAR' : estado === 'desactivado' ? 'BLOQUEADO' : 'EMPEZAR'}
              </Texto>
            </Pressable>
          </RecuadroGlass>
          <View style={styles.tooltipFlechaWrapper}>
            <View style={[styles.tooltipFlecha, { backgroundColor: 'rgba(255,255,255,0.7)' }]} />
          </View>
        </View>"""

nodo_code = nodo_code.replace(old_tooltip, new_tooltip)

# Remove background color from tooltipCaja to let RecuadroGlass work
nodo_code = nodo_code.replace("backgroundColor: '#FFFFFF',", "backgroundColor: 'rgba(255, 255, 255, 0.55)',\n    borderColor: 'rgba(255, 255, 255, 0.8)',\n    borderWidth: 1,")


with open('/home/arch-i7/Proyects/app/src/diseno/componentes/Nodo.tsx', 'w') as f:
    f.write(nodo_code)
