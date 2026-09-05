import re

with open('/home/arch-i7/Proyects/app/src/modulos/aby/componentes/PreguntaVisualAby.tsx', 'r') as f:
    content = f.read()

# Replace the 'dias' check with 'texto'
old_block = """  if (pregunta.tipo === 'dias') {
    const seleccionados = Array.isArray(seleccionado) ? seleccionado : [];
    return (
      <View style={styles.raiz}><ArbolLateralTurnoAby categoria={categoria} />
        <Texto style={styles.titulo}>{pregunta.titulo}</Texto>
        <View style={styles.dias}>
          {dias.map((dia, indice) => {
            const valor = String(indice + 1);
            const activo = seleccionados.includes(valor);
            return <Pressable accessibilityLabel={`Dia ${dia}`} accessibilityRole="button" accessibilityState={{ selected: activo }} key={dia} onPress={() => { hapticSeguro('seleccion'); onSeleccionar(activo ? seleccionados.filter((item) => item !== valor) : [...seleccionados, valor]); }} style={[styles.dia, activo && colorActivo]}><Texto style={[styles.diaTexto, activo && styles.diaTextoActivo]}>{dia}</Texto></Pressable>;
          })}
        </View>
      </View>
    );
  }"""

new_block = """  if (pregunta.tipo === 'texto') {
    return (
      <View style={styles.raiz}>
        <ArbolLateralTurnoAby categoria={categoria} />
        <Texto style={styles.titulo}>{pregunta.titulo}</Texto>
      </View>
    );
  }"""
content = content.replace(old_block, new_block)

with open('/home/arch-i7/Proyects/app/src/modulos/aby/componentes/PreguntaVisualAby.tsx', 'w') as f:
    f.write(content)

