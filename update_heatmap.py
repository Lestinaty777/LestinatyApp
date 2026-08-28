import re

with open('/home/arch-i7/Proyects/app/src/modulos/senderos/paginas/analisis/rutinas/MapaCalor.tsx', 'r') as f:
    acode = f.read()

# Add Texto to imports
if "import { Texto }" not in acode:
    acode = acode.replace("import { View, StyleSheet, Text } from 'react-native';", "import { View, StyleSheet, Text } from 'react-native';\nimport { Texto } from '../../../../../diseno';")

# Add the Day Labels and fix borders
hook_spot = "  return ("
new_hook_spot = """  // Función auxiliar para opacidad
  const conAlpha = (color: string, alpha: string) => {
    return `${color}${alpha}`;
  };

  return (
    <View style={{ width: '100%' }}>
      {/* Etiquetas de Días */}
      <View style={styles.diasFila}>
        {['L', 'M', 'M', 'J', 'V', 'S', 'D'].map((letra, i) => (
          <Texto key={i} style={styles.letraDia}>{letra}</Texto>
        ))}
      </View>
"""
acode = acode.replace("  return (", new_hook_spot, 1)

grid_spot = """<View style={styles.grid}>
      {datos.map((dia, index) => {"""
new_grid_spot = """<View style={styles.grid}>
        {datos.map((dia, index) => {"""
acode = acode.replace(grid_spot, new_grid_spot)

# Replace the Reanimated View styling
old_view = """        return (
          <Reanimated.View 
            key={dia.fecha}
            entering={FadeIn.delay(index * 15).duration(300)}
            style={[
              styles.celda, 
              { 
                backgroundColor: intensidad > 0 ? acento : 'rgba(255,255,255,0.1)',
                opacity: intensidad > 0 ? opacity : 1,
              }
            ]} 
          />
        );"""
new_view = """        const vacio = intensidad === 0;
        return (
          <Reanimated.View 
            key={dia.fecha}
            entering={FadeIn.delay(index * 15).duration(300)}
            style={[
              styles.celda, 
              { 
                backgroundColor: vacio ? 'rgba(255,255,255,0.03)' : acento,
                opacity: vacio ? 1 : opacity,
                borderColor: vacio ? conAlpha(acento, '30') : 'transparent',
                borderWidth: vacio ? 1 : 0
              }
            ]} 
          />
        );"""
acode = acode.replace(old_view, new_view)

# Close the outer View
acode = acode.replace("    </View>\n  );", "    </View>\n    </View>\n  );")

# Update styles
styles_spot = """const styles = StyleSheet.create({"""
new_styles = """const styles = StyleSheet.create({
  diasFila: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: 2, // Slight padding to align letters over columns
    marginBottom: 8,
    marginTop: 6
  },
  letraDia: {
    width: '12%',
    textAlign: 'center',
    fontFamily: 'MontserratAlternates-SemiBold',
    fontSize: 10,
    color: 'rgba(255,255,255,0.4)',
  },"""
acode = acode.replace(styles_spot, new_styles)

# Remove the text fallback logic if any
acode = acode.replace("if (!datos || datos.length === 0) {\n    return <Text style={{color:'white'}}>No hay datos</Text>;\n  }", "if (!datos || datos.length === 0) return null;")

with open('/home/arch-i7/Proyects/app/src/modulos/senderos/paginas/analisis/rutinas/MapaCalor.tsx', 'w') as f:
    f.write(acode)

