import re

# 1. Update SenderosPantalla.tsx
with open('/home/arch-i7/Proyects/app/src/modulos/senderos/pantallas/SenderosPantalla.tsx', 'r') as f:
    senderos_code = f.read()

old_icono_base = """      <Svg width={size} height={(size * 23) / 24} viewBox="0 0 24 23" fill="none">
        <Path
          d="M10.2267 2.29713C11.0492 1.90101 12.0074 1.90101 12.83 2.29713L17.2632 4.43204C18.0857 4.82816 18.6831 5.5773 18.8863 6.46738L19.9812 11.2645C20.1843 12.1546 19.9711 13.0887 19.4019 13.8025L16.334 17.6495C15.7648 18.3633 14.9015 18.779 13.9886 18.779H9.06809C8.15512 18.779 7.29183 18.3633 6.7226 17.6495L3.65474 13.8025C3.08551 13.0887 2.87229 12.1546 3.07545 11.2645L4.17036 6.46738C4.37351 5.5773 4.97093 4.82816 5.79349 4.43204L10.2267 2.29713Z"
          fill={color}
        />
        <Path d="M5.79349 4.43204L10.2267 2.29713C11.0492 1.90101 12.0074 1.90101 12.83 2.29713L17.2632 4.43204C18.0857 4.82816 18.6831 5.5773 18.8863 6.46738L19.9812 11.2645C20.1843 12.1546 19.9711 13.0887 19.4019 13.8025L16.334 17.6495C15.7648 18.3633 14.9015 18.779 13.9886 18.779H9.06809C8.15512 18.779 7.29183 18.3633 6.7226 17.6495L3.65474 13.8025C3.08551 13.0887 2.87229 12.1546 3.07545 11.2645L4.17036 6.46738C4.37351 5.5773 4.97093 4.82816 5.79349 4.43204Z" fill="url(#paint0_linear_8542_1420)" fillOpacity="0.4" />
        <Defs>
          <LinearGradient id="paint0_linear_8542_1420" x1="18.3683" y1="2.29712" x2="3.07542" y2="11.2645" gradientUnits="userSpaceOnUse">
            <Stop stopColor="white" />
            <Stop offset="0.672879" stopColor="white" stopOpacity="0" />
          </LinearGradient>
        </Defs>
      </Svg>
      <Icono color="#FFFFFF" size={iconoSize} strokeWidth={2.5} />"""

new_icono_base = """      <Svg width={size} height={(size * 23) / 24} viewBox="0 0 24 23" fill="none">
        <Path
          d="M10.2267 2.29713C11.0492 1.90101 12.0074 1.90101 12.83 2.29713L17.2632 4.43204C18.0857 4.82816 18.6831 5.5773 18.8863 6.46738L19.9812 11.2645C20.1843 12.1546 19.9711 13.0887 19.4019 13.8025L16.334 17.6495C15.7648 18.3633 14.9015 18.779 13.9886 18.779H9.06809C8.15512 18.779 7.29183 18.3633 6.7226 17.6495L3.65474 13.8025C3.08551 13.0887 2.87229 12.1546 3.07545 11.2645L4.17036 6.46738C4.37351 5.5773 4.97093 4.82816 5.79349 4.43204L10.2267 2.29713Z"
          fill={color}
        />
        <Path d="M5.79349 4.43204L10.2267 2.29713C11.0492 1.90101 12.0074 1.90101 12.83 2.29713L17.2632 4.43204C18.0857 4.82816 18.6831 5.5773 18.8863 6.46738L19.9812 11.2645C20.1843 12.1546 19.9711 13.0887 19.4019 13.8025L16.334 17.6495C15.7648 18.3633 14.9015 18.779 13.9886 18.779H9.06809C8.15512 18.779 7.29183 18.3633 6.7226 17.6495L3.65474 13.8025C3.08551 13.0887 2.87229 12.1546 3.07545 11.2645L4.17036 6.46738C4.37351 5.5773 4.97093 4.82816 5.79349 4.43204Z" fill="url(#paint0_linear_8542_1420)" fillOpacity="0.4" />
        <Defs>
          <LinearGradient id="paint0_linear_8542_1420" x1="18.3683" y1="2.29712" x2="3.07542" y2="11.2645" gradientUnits="userSpaceOnUse">
            <Stop stopColor="white" />
            <Stop offset="0.672879" stopColor="white" stopOpacity="0" />
          </LinearGradient>
        </Defs>
      </Svg>
      <View style={{ transform: [{ translateX: -1.5 }] }}>
        <Icono color="#FFFFFF" size={iconoSize} strokeWidth={2.5} />
      </View>"""
senderos_code = senderos_code.replace(old_icono_base, new_icono_base)

with open('/home/arch-i7/Proyects/app/src/modulos/senderos/pantallas/SenderosPantalla.tsx', 'w') as f:
    f.write(senderos_code)

# 2. Update Nodo.tsx
with open('/home/arch-i7/Proyects/app/src/diseno/componentes/Nodo.tsx', 'r') as f:
    nodo_code = f.read()

# Add tooltipOffset prop
old_props = """  tituloTooltip?: string;
  descripcionTooltip?: string;
  progresoTooltip?: number;
  estado?: EstadoNodo;
}"""
new_props = """  tituloTooltip?: string;
  descripcionTooltip?: string;
  progresoTooltip?: number;
  estado?: EstadoNodo;
  tooltipOffset?: number;
}"""
nodo_code = nodo_code.replace(old_props, new_props)

old_destructure = """  descripcionTooltip = 'Haz clic aquí para comenzar esta etapa del recorrido.',
  progresoTooltip,
  estado = 'activo',
}: NodoProps) {"""
new_destructure = """  descripcionTooltip = 'Haz clic aquí para comenzar esta etapa del recorrido.',
  progresoTooltip,
  estado = 'activo',
  tooltipOffset = 0,
}: NodoProps) {"""
nodo_code = nodo_code.replace(old_destructure, new_destructure)

# Apply tooltipOffset to tooltipCaja ONLY, leave flecha centered
# Actually, if we apply it to tooltipCaja, it will move inside the positioning wrapper
old_caja = "<View style={styles.tooltipCaja}>"
new_caja = "<View style={[styles.tooltipCaja, { transform: [{ translateX: tooltipOffset }] }]}>"
nodo_code = nodo_code.replace(old_caja, new_caja)

# Apply translateX to the mini tooltip icon
old_mini_icon = '<Icono color="#FFFFFF" size={16} strokeWidth={2.5} />'
new_mini_icon = '<View style={{ transform: [{ translateX: -1.5 }] }}><Icono color="#FFFFFF" size={16} strokeWidth={2.5} /></View>'
nodo_code = nodo_code.replace(old_mini_icon, new_mini_icon)

# Apply translateX to the main Node icon
old_main_icon = """          {/* Icono centrado */}
          <View style={styles.iconoCentrado}>
            <Icono color="#FFFFFF" size={size * 0.4} strokeWidth={2.5} />
          </View>"""
new_main_icon = """          {/* Icono centrado con corrección visual de -1.5px */}
          <View style={[styles.iconoCentrado, { transform: [{ translateX: -1.5 }] }]}>
            <Icono color="#FFFFFF" size={size * 0.4} strokeWidth={2.5} />
          </View>"""
nodo_code = nodo_code.replace(old_main_icon, new_main_icon)

with open('/home/arch-i7/Proyects/app/src/diseno/componentes/Nodo.tsx', 'w') as f:
    f.write(nodo_code)

# 3. Update MapaCompartido.tsx to calculate tooltipOffset
with open('/home/arch-i7/Proyects/app/src/modulos/senderos/paginas/MapaCompartido.tsx', 'r') as f:
    mapa_code = f.read()

old_nodo_render = """                <Nodo 
                  Icono={nodo.icono_lucide}
                  masterColor={masterColor}
                  variacion={variacion}
                  size={70}
                  isSelected={nodoSeleccionado === nodo.id}
                  tituloTooltip={nodo.titulo}
                  descripcionTooltip={nodo.subtitulo}
                  estado={nodo.nivel < 2 ? 'completado' : nodo.nivel === 2 ? 'activo' : 'desactivado'}
                  progresoTooltip={nodo.nivel === 2 ? 65 : nodo.nivel < 2 ? 100 : 0}
                  onPress={() => setNodoSeleccionado(nodo.id === nodoSeleccionado ? null : nodo.id)}
                />"""

new_nodo_render = """                {(() => {
                  // Calcular si el tooltip se sale de la pantalla
                  const TOOLTIP_WIDTH = 280;
                  const MARGIN_EDGE = 16;
                  const leftEdge = p1.x - (TOOLTIP_WIDTH / 2);
                  const rightEdge = p1.x + (TOOLTIP_WIDTH / 2);
                  
                  let tooltipOffset = 0;
                  if (leftEdge < MARGIN_EDGE) {
                    tooltipOffset = MARGIN_EDGE - leftEdge;
                  } else if (rightEdge > SCREEN_WIDTH - MARGIN_EDGE) {
                    tooltipOffset = (SCREEN_WIDTH - MARGIN_EDGE) - rightEdge;
                  }

                  return (
                    <Nodo 
                      Icono={nodo.icono_lucide}
                      masterColor={masterColor}
                      variacion={variacion}
                      size={70}
                      isSelected={nodoSeleccionado === nodo.id}
                      tituloTooltip={nodo.titulo}
                      descripcionTooltip={nodo.subtitulo}
                      estado={nodo.nivel < 2 ? 'completado' : nodo.nivel === 2 ? 'activo' : 'desactivado'}
                      progresoTooltip={nodo.nivel === 2 ? 65 : nodo.nivel < 2 ? 100 : 0}
                      tooltipOffset={tooltipOffset}
                      onPress={() => setNodoSeleccionado(nodo.id === nodoSeleccionado ? null : nodo.id)}
                    />
                  );
                })()}"""
mapa_code = mapa_code.replace(old_nodo_render, new_nodo_render)

with open('/home/arch-i7/Proyects/app/src/modulos/senderos/paginas/MapaCompartido.tsx', 'w') as f:
    f.write(mapa_code)

