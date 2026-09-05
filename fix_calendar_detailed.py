import re

with open('/home/arch-i7/Proyects/app/src/modulos/inicio/pantallas/InicioPantalla.tsx', 'r') as f:
    content = f.read()

# 1. Ajustar altura a 400
content = content.replace("if (activeMenu === 'calendar') targetH = 260;", "if (activeMenu === 'calendar') targetH = 430;")

# 2. Reescribir el panel
old_panel = r"function PanelRacha\(\) \{.+?return \(.+?\);\n\}"

new_panel = """function PanelRacha() {
  const diasRacha = [
    { dia: 'L', activo: true },
    { dia: 'M', activo: true },
    { dia: 'M', activo: false },
    { dia: 'J', activo: true, hoy: true },
    { dia: 'V', activo: false },
    { dia: 'S', activo: false },
    { dia: 'D', activo: false },
  ];

  // Calendario mensual realista (ej. empieza en Miércoles, offset = 2)
  const offset = 2;
  const mesCeldas = Array.from({ length: 35 }).map((_, i) => {
    const num = i - offset + 1;
    const valido = num > 0 && num <= 30; // Mes de 30 días
    // Días aleatorios activos para simular historial
    const activo = valido && [1,2,3,5,6,8,9,10,11,15,16,18,19,20,22,23,24,25].includes(num);
    const esHoy = num === 26;
    return { num: valido ? num.toString() : '', activo, valido, esHoy };
  });

  const progresoSemana = (3 / 6) * 100; 
  const diasSemanales = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];

  return (
    <View style={{ flex: 1, paddingHorizontal: 20, paddingTop: 5, paddingBottom: 25 }}>
      {/* Background Texture */}
      <View style={[StyleSheet.absoluteFill, { opacity: 0.1 }]} pointerEvents="none">
        <TexturaPixelArt />
      </View>
      
      {/* 1. CABECERA */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <View style={{ width: 42, height: 42, borderRadius: 8, backgroundColor: '#F26D21', borderBottomWidth: 4, borderBottomColor: oscurecer('#F26D21', 0.6), justifyContent: 'center', alignItems: 'center' }}>
            <Flame color="#FFFFFF" size={24} fill="#FFFFFF" />
          </View>
          <View>
            <Texto style={{ fontSize: 9, color: 'rgba(0,0,0,0.5)', fontFamily: 'Montserrat-Bold', letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 0 }}>VITALIDAD ACTUAL</Texto>
            <Texto style={{ fontSize: 22, fontFamily: 'Montserrat-Bold', color: '#111111' }}>3 Días</Texto>
          </View>
        </View>
        <View style={{ alignItems: 'flex-end' }}>
          <Texto style={{ fontSize: 8, color: 'rgba(0,0,0,0.5)', fontFamily: 'Montserrat-Bold', letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 2 }}>XP SEMANAL</Texto>
          <View style={{ backgroundColor: '#4A8BB3', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, borderBottomWidth: 2, borderBottomColor: oscurecer('#4A8BB3', 0.6) }}>
            <Texto style={{ fontSize: 13, fontFamily: 'Montserrat-Bold', color: '#FFFFFF' }}>+450</Texto>
          </View>
        </View>
      </View>

      {/* 2. CALENDARIO HIPER DETALLADO (MES) */}
      <View style={{ marginBottom: 25 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12, borderBottomWidth: 1, borderBottomColor: 'rgba(0,0,0,0.1)', paddingBottom: 8 }}>
          <Texto style={{ fontSize: 11, color: '#111111', fontFamily: 'Montserrat-Bold', letterSpacing: 1, textTransform: 'uppercase' }}>SEPTIEMBRE</Texto>
          <Texto style={{ fontSize: 11, color: 'rgba(0,0,0,0.4)', fontFamily: 'Montserrat-Bold', letterSpacing: 1, textTransform: 'uppercase' }}>18/30 LOGRADOS</Texto>
        </View>
        
        {/* Cabecera de días de la semana */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
          {diasSemanales.map((letra, i) => (
             <View key={i} style={{ width: '13%', alignItems: 'center' }}>
               <Texto style={{ fontSize: 9, color: 'rgba(0,0,0,0.4)', fontFamily: 'Montserrat-Bold' }}>{letra}</Texto>
             </View>
          ))}
        </View>

        {/* Rejilla 7x5 */}
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: 8 }}>
          {mesCeldas.map((celda, i) => (
            <View key={i} style={[{ 
              width: '13%', 
              aspectRatio: 1, // Hacemos que sea un cuadrado perfecto
              borderRadius: 6, 
              justifyContent: 'center', 
              alignItems: 'center'
            }, 
            celda.valido 
              ? (celda.activo 
                  ? { backgroundColor: '#F26D21', borderBottomWidth: 3, borderBottomColor: oscurecer('#F26D21', 0.6) }
                  : { backgroundColor: 'rgba(0,0,0,0.02)', borderWidth: 1, borderColor: 'rgba(0,0,0,0.1)' }
                )
              : { } // Celdas vacías del offset sin estilo
            ,
            celda.esHoy && { borderColor: '#111111', borderWidth: 2, borderBottomWidth: 3 }
            ]}>
               {celda.valido && (
                 <Texto style={{ fontSize: 11, color: celda.esHoy ? '#111111' : (celda.activo ? '#FFF' : 'rgba(0,0,0,0.3)'), fontFamily: 'Montserrat-Bold' }}>
                   {celda.num}
                 </Texto>
               )}
            </View>
          ))}
        </View>
      </View>
      
      {/* 3. TERMÓMETRO SEMANAL (VIAJE) */}
      <View style={{ position: 'relative', marginTop: 10 }}>
        <Texto style={{ fontSize: 9, color: 'rgba(0,0,0,0.4)', fontFamily: 'Montserrat-Bold', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 12 }}>VELOCIDAD ACTUAL (ESTA SEMANA)</Texto>
        
        {/* Línea Base del Termómetro */}
        <View style={{ position: 'absolute', top: 40, left: 15, right: 15, height: 4, backgroundColor: 'rgba(0,0,0,0.05)', borderRadius: 2 }} />
        {/* Línea Activa (Fuego) */}
        <View style={{ position: 'absolute', top: 40, left: 15, width: `${progresoSemana}%`, height: 4, backgroundColor: '#F26D21', borderRadius: 2 }} />

        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          {diasRacha.map((d, i) => (
            <View key={i} style={{ alignItems: 'center', gap: 8, width: 32 }}>
              {/* Nodo del Termómetro */}
              <View style={[{ 
                width: 24, height: 24, borderRadius: 12, justifyContent: 'center', alignItems: 'center',
                backgroundColor: d.activo ? '#F26D21' : '#EAEAEA',
                borderWidth: d.hoy ? 2 : (d.activo ? 0 : 1),
                borderColor: d.hoy ? '#111111' : 'rgba(0,0,0,0.1)',
                borderBottomWidth: d.activo ? 3 : 1,
                borderBottomColor: d.activo ? oscurecer('#F26D21', 0.5) : 'rgba(0,0,0,0.1)'
              }]}>
                 {d.activo && <Zap size={12} color="#FFF" fill="#FFF" />}
              </View>
              <Texto style={{ fontSize: 10, color: d.hoy ? '#111111' : (d.activo ? '#111111' : 'rgba(0,0,0,0.4)'), fontFamily: 'Montserrat-Bold' }}>{d.dia}</Texto>
            </View>
          ))}
        </View>
      </View>
      
    </View>
  );
}"""

content = re.sub(old_panel, new_panel, content, flags=re.DOTALL)

with open('/home/arch-i7/Proyects/app/src/modulos/inicio/pantallas/InicioPantalla.tsx', 'w') as f:
    f.write(content)
