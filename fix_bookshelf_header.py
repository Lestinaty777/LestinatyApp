import re

with open('/home/arch-i7/Proyects/app/src/modulos/senderos/paginas/CompartidosSenderos.tsx', 'r') as f:
    code = f.read()

old_bookshelf = """      {/* LIBRERO PREMIUM Y LIBROS */}
      <View style={styles.libreroContenedorPrincipal}>"""

new_bookshelf = """      {/* ENCABEZADO COMPACTO DE BIBLIOTECA */}
      <View style={{ paddingHorizontal: 24, marginTop: 10, marginBottom: -10, zIndex: 10 }}>
         <Texto style={{ fontFamily: 'MontserratAlternates-Bold', fontSize: 10, color: 'rgba(0,0,0,0.3)', letterSpacing: 1.5 }}>
           BIBLIOTECA COMPARTIDA
         </Texto>
         <View style={{ height: 1, backgroundColor: 'rgba(0,0,0,0.06)', width: '100%', marginTop: 8 }} />
      </View>

      {/* LIBRERO PREMIUM Y LIBROS */}
      <View style={styles.libreroContenedorPrincipal}>"""
code = code.replace(old_bookshelf, new_bookshelf)

with open('/home/arch-i7/Proyects/app/src/modulos/senderos/paginas/CompartidosSenderos.tsx', 'w') as f:
    f.write(code)

