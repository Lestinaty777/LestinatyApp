import re

with open('/home/arch-i7/Proyects/app/src/diseno/componentes/Nodo.tsx', 'r') as f:
    nodo_code = f.read()

# Let's just regex replace the interface
nodo_code = re.sub(
    r'interface NodoProps \{[\s\S]*?\}', 
    '''export type EstadoNodo = 'activo' | 'completado' | 'desactivado';

interface NodoProps {
  Icono: any;
  masterColor: string;
  onPress?: () => void;
  size?: number;
  variacion?: number;
  isSelected?: boolean;
  tituloTooltip?: string;
  descripcionTooltip?: string;
  progresoTooltip?: number;
  estado?: EstadoNodo;
}''', 
    nodo_code
)

with open('/home/arch-i7/Proyects/app/src/diseno/componentes/Nodo.tsx', 'w') as f:
    f.write(nodo_code)
