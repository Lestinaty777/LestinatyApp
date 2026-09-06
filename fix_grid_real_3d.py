import re

with open('/home/arch-i7/Proyects/app/src/modulos/inicio/pantallas/InicioPantalla.tsx', 'r') as f:
    content = f.read()

old_grid = r"\{\/\* Rejilla 7x5 \*\/\}\n\s*<View style=\{\{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: 8 \}\}>\n\s*\{mesCeldas\.map\(\(celda, i\) => \(\n\s*<View key=\{i\} style=\{\[\{ \n\s*width: '13%', \n\s*aspectRatio: 1, \/\/ Hacemos que sea un cuadrado perfecto\n\s*borderRadius: 6, \n\s*justifyContent: 'center', \n\s*alignItems: 'center'\n\s*\}, \n\s*celda\.valido \n\s*\? \(celda\.activo \n\s*\? \{ backgroundColor: '#F26D21', borderBottomWidth: 3, borderBottomColor: oscurecer\('#F26D21', 0\.6\) \}\n\s*: \{ backgroundColor: 'rgba\(0,0,0,0\.02\)', borderWidth: 1, borderColor: 'rgba\(0,0,0,0\.1\)' \}\n\s*\)\n\s*: \{ \} \/\/ Celdas vacías del offset sin estilo\n\s*,\n\s*celda\.esHoy && \{ borderColor: '#111111', borderWidth: 2, borderBottomWidth: 3 \}\n\s*\]\}>\n\s*\{celda\.valido && \(\n\s*<Texto style=\{\{ fontSize: 11, color: celda\.esHoy \? '#111111' : \(celda\.activo \? '#FFF' : 'rgba\(0,0,0,0\.3\)'\), fontFamily: 'Montserrat-Bold' \}\}>\n\s*\{celda\.num\}\n\s*<\/Texto>\n\s*\)\}\n\s*<\/View>\n\s*\)\)\}\n\s*<\/View>"

new_grid = """{/* Rejilla 7x5 */}
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: 8 }}>
          {mesCeldas.map((celda, i) => (
            <View key={i} style={{ width: '13%', aspectRatio: 1 }}>
               {/* Sombra 3D (Solo para activos o el día de hoy) */}
               {celda.valido && (celda.activo || celda.esHoy) && (
                 <View style={{ position: 'absolute', top: 3, left: 0, right: 0, bottom: -3, backgroundColor: celda.esHoy ? '#111111' : oscurecer('#F26D21', 0.6), borderRadius: 6 }} />
               )}
               
               {/* Cara frontal */}
               <View style={[{
                  position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                  borderRadius: 6, justifyContent: 'center', alignItems: 'center'
               },
               celda.valido 
                  ? (celda.activo 
                      ? { backgroundColor: '#F26D21' }
                      : { backgroundColor: 'rgba(0,0,0,0.02)', borderWidth: 1, borderColor: 'rgba(0,0,0,0.1)' }
                    )
                  : {},
               celda.esHoy && { borderColor: '#111111', borderWidth: 2, backgroundColor: celda.activo ? '#F26D21' : 'rgba(0,0,0,0.05)' }
               ]}>
                 {celda.valido && (
                   <Texto style={{ fontSize: 11, color: celda.esHoy ? '#111111' : (celda.activo ? '#FFF' : 'rgba(0,0,0,0.3)'), fontFamily: 'Montserrat-Bold' }}>
                     {celda.num}
                   </Texto>
                 )}
               </View>
            </View>
          ))}
        </View>"""

content = re.sub(old_grid, new_grid, content, flags=re.DOTALL)

with open('/home/arch-i7/Proyects/app/src/modulos/inicio/pantallas/InicioPantalla.tsx', 'w') as f:
    f.write(content)
