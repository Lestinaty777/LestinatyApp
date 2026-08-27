import re

with open('/home/arch-i7/Proyects/app/src/modulos/senderos/paginas/MapaCompartido.tsx', 'r') as f:
    code = f.read()

# Add states to nodes
old_nodo = """                  Icono={nodo.tipo === 'meta' ? Flame : Compass}
                  masterColor={masterColor}
                  variacion={variacion}
                  size={70}
                  isSelected={nodoSeleccionado === nodo.id}
                  tituloTooltip={`Misión ${nodo.nivel + 1}`}
                  onPress={() => setNodoSeleccionado(nodo.id === nodoSeleccionado ? null : nodo.id)}
                />"""

new_nodo = """                  Icono={nodo.tipo === 'meta' ? Flame : Compass}
                  masterColor={masterColor}
                  variacion={variacion}
                  size={70}
                  isSelected={nodoSeleccionado === nodo.id}
                  tituloTooltip={`Misión ${nodo.nivel + 1}`}
                  estado={nodo.nivel < 2 ? 'completado' : nodo.nivel === 2 ? 'activo' : 'desactivado'}
                  progresoTooltip={nodo.nivel === 2 ? 65 : nodo.nivel < 2 ? 100 : 0}
                  onPress={() => setNodoSeleccionado(nodo.id === nodoSeleccionado ? null : nodo.id)}
                />"""

code = code.replace(old_nodo, new_nodo)

with open('/home/arch-i7/Proyects/app/src/modulos/senderos/paginas/MapaCompartido.tsx', 'w') as f:
    f.write(code)
