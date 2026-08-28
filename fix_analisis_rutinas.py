import re

with open('/home/arch-i7/Proyects/app/src/modulos/senderos/paginas/AnalisisSenderos.tsx', 'r') as f:
    acode = f.read()

# Add imports for Rutinas
if 'RutinasAnalisis' not in acode:
    acode = acode.replace("import { Texto, RecuadroGlass, colores } from '../../../diseno';", "import { Texto, RecuadroGlass, colores } from '../../../diseno';\nimport { RutinasAnalisis } from './analisis/rutinas/RutinasAnalisis';\nimport { rutinasMockData } from './analisis/rutinas/datosMock';")

# Find where the old layout starts (after selectorCategorias)
old_layout_start = """      </View>

      {itemsCargados < 1 ? <View style={[styles.resumenGlass, { backgroundColor: 'rgba(255,255,255,0.05)', height: 110, borderColor: 'rgba(255,255,255,0.1)' }]} /> : ("""

# We'll replace the entire bottom part with a conditional switch.
# Wait, replacing the entire bottom part with regex is safer if we just match from old_layout_start to the end of the return statement.
# Let's find the closing tag of <View style={styles.raiz}>.

# Instead of regex, let's just do a string replace of the entire layout logic block.
# Actually, I can keep the old layout as a fallback!
old_fallback = """{itemsCargados < 1 ? <View style={[styles.resumenGlass, { backgroundColor: 'rgba(255,255,255,0.05)', height: 110, borderColor: 'rgba(255,255,255,0.1)' }]} /> : ("""
new_fallback = """{categoriaId === 'rutinas' ? (
        <RutinasAnalisis datos={rutinasMockData} acento={categoria.acento} itemsCargados={itemsCargados} />
      ) : (
        <>
          {itemsCargados < 1 ? <View style={[styles.resumenGlass, { backgroundColor: 'rgba(255,255,255,0.05)', height: 110, borderColor: 'rgba(255,255,255,0.1)' }]} /> : ("""
acode = acode.replace(old_fallback, new_fallback)

# Now we need to close the <> block for the fallback at the very bottom.
old_close = """      </Reanimated.View>
      )}
    </View>
  );
}"""
new_close = """      </Reanimated.View>
      )}
        </>
      )}
    </View>
  );
}"""
acode = acode.replace(old_close, new_close)

with open('/home/arch-i7/Proyects/app/src/modulos/senderos/paginas/AnalisisSenderos.tsx', 'w') as f:
    f.write(acode)

