import re

with open('/home/arch-i7/Proyects/app/src/modulos/inicio/pantallas/InicioPantalla.tsx', 'r') as f:
    content = f.read()

# Mover el TextoRN fuera del SVG
content = content.replace("""                            {/* Pequeño texto rotado en el stub */}
                            <TextoRN style={{ position: 'absolute', right: 5, top: 32, fontSize: 6, color: 'rgba(255,255,255,0.5)', transform: [{ rotate: '90deg' }], fontFamily: 'Montserrat-Bold' }}>Nº 01</TextoRN>
                          </Svg>""", """                          </Svg>
                          {/* Pequeño texto rotado en el stub (Fuera del SVG) */}
                          <TextoRN style={{ position: 'absolute', right: -3, top: 40, fontSize: 7, color: 'rgba(255,255,255,0.6)', transform: [{ rotate: '90deg' }], fontFamily: 'Montserrat-Bold' }}>Nº 01</TextoRN>""")

with open('/home/arch-i7/Proyects/app/src/modulos/inicio/pantallas/InicioPantalla.tsx', 'w') as f:
    f.write(content)
