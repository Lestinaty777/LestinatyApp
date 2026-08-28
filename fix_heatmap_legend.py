import re

with open('/home/arch-i7/Proyects/app/src/modulos/senderos/paginas/analisis/rutinas/MapaCalor.tsx', 'r') as f:
    acode = f.read()

# Fix Imports
if "import { Texto, colores }" not in acode:
    acode = acode.replace("import { Texto } from '../../../../../diseno';", "import { Texto, colores } from '../../../../../diseno';")

# Make day labels brighter
acode = acode.replace("color: 'rgba(255,255,255,0.4)',", "color: 'rgba(255,255,255,0.7)',")

# Insert Legend below grid
grid_end_spot = "    </View>\n    </View>"
legend_code = """    </View>

      {/* Simbología */}
      <View style={styles.leyenda}>
        <Texto style={styles.leyendaTexto}>Menos</Texto>
        <View style={[styles.celdaLeyenda, { backgroundColor: 'rgba(255,255,255,0.03)', borderColor: conAlpha(acento, '30'), borderWidth: 1 }]} />
        <View style={[styles.celdaLeyenda, { backgroundColor: acento, opacity: 0.4 }]} />
        <View style={[styles.celdaLeyenda, { backgroundColor: acento, opacity: 0.7 }]} />
        <View style={[styles.celdaLeyenda, { backgroundColor: acento, opacity: 1 }]} />
        <Texto style={styles.leyendaTexto}>Más</Texto>
      </View>
    </View>"""
acode = acode.replace(grid_end_spot, legend_code)

# Add Legend styles
styles_end = "});"
legend_styles = """
  leyenda: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', marginTop: 16, gap: 6 },
  celdaLeyenda: { width: 12, height: 12, borderRadius: 3 },
  leyendaTexto: { fontFamily: 'MontserratAlternates-Medium', fontSize: 10, color: 'rgba(255,255,255,0.6)' }
});"""
acode = acode.replace(styles_end, legend_styles)

with open('/home/arch-i7/Proyects/app/src/modulos/senderos/paginas/analisis/rutinas/MapaCalor.tsx', 'w') as f:
    f.write(acode)

