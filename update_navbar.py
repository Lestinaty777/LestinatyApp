import re

with open('/home/arch-i7/Proyects/app/src/modulos/inicio/pantallas/InicioPantalla.tsx', 'r') as f:
    content = f.read()

# Modify BotonAccion
boton_old = """  const BotonAccion = ({ Icono, etiqueta }: { Icono: any, etiqueta: string }) => (
    <Pressable 
      style={({ pressed }) => [styles.botonAccion, pressed && styles.botonAccionPresionado]}
      onPress={() => hapticSeguro('seleccion')}
    >
      <View style={styles.iconoContenedor}>
        <Icono color={biomas.inicio.MasterColor} size={24} strokeWidth={2.5} />
      </View>
      <Texto style={styles.etiquetaBoton}>{etiqueta}</Texto>
    </Pressable>
  );"""
boton_new = """  const BotonAccion = ({ Icono }: { Icono: any }) => (
    <Pressable 
      style={({ pressed }) => [styles.botonAccion, pressed && styles.botonAccionPresionado]}
      onPress={() => hapticSeguro('seleccion')}
    >
      <Icono color={colores.textoSecundario} size={24} strokeWidth={2.5} />
    </Pressable>
  );"""
content = content.replace(boton_old, boton_new)

# Modify layout
layout_old = """        {/* Espacio superior libre (20%) con los accesos directos */}
        <View style={styles.espacioSuperior}>
          <View style={styles.barraAcciones}>
            <BotonAccion Icono={Book} etiqueta="Apuntes" />
            <BotonAccion Icono={Calendar} etiqueta="Agenda" />
            <BotonAccion Icono={Sparkles} etiqueta="Repaso IA" />
            <BotonAccion Icono={Store} etiqueta="Tienda" />
          </View>
        </View>"""
layout_new = """        {/* Barra de Navegación Superior */}
        <View style={styles.navbarSuperior}>
          <BotonAccion Icono={Book} />
          <BotonAccion Icono={Calendar} />
          <BotonAccion Icono={Sparkles} />
          <BotonAccion Icono={Store} />
        </View>
        
        {/* Espacio que empuja el mapa hacia abajo para respetar el 80% */}
        <View style={styles.espacioFlexible} />"""
content = content.replace(layout_old, layout_new)

# Modify styles
styles_old = """  espacioSuperior: {
    flex: 0.2, 
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  barraAcciones: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  botonAccion: {
    alignItems: 'center',
    gap: 6,
  },
  botonAccionPresionado: {
    opacity: 0.7,
    transform: [{ scale: 0.95 }],
  },
  iconoContenedor: {
    backgroundColor: '#FFFFFF',
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4, // Para Android
  },
  etiquetaBoton: {
    fontFamily: 'MontserratAlternates-SemiBold',
    fontSize: 10,
    color: colores.textoSecundario,
  },"""
styles_new = """  navbarSuperior: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginTop: 8,
    borderRadius: 20,
    // Sombra sutil para que resalte del gris claro
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  espacioFlexible: {
    flex: 1, // Toma todo el espacio restante hasta empujar la capaMapa
  },
  botonAccion: {
    padding: 8, // Aumenta el area táctil
  },
  botonAccionPresionado: {
    opacity: 0.5,
    transform: [{ scale: 0.9 }],
  },"""
content = content.replace(styles_old, styles_new)

# Replace flex: 0.8 in capaMapa to just be fixed height since we are using flex: 1 for the space
content = content.replace("""  capaMapa: {
    flex: 0.8, 
    overflow: 'hidden',
  }""", """  capaMapa: {
    height: '80%', // Forzamos el 80% de altura estricto
    overflow: 'hidden',
  }""")


with open('/home/arch-i7/Proyects/app/src/modulos/inicio/pantallas/InicioPantalla.tsx', 'w') as f:
    f.write(content)

