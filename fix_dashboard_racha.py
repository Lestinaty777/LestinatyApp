import re

with open('/home/arch-i7/Proyects/app/src/modulos/inicio/pantallas/InicioPantalla.tsx', 'r') as f:
    content = f.read()

# 1. Ajustar la altura de expansión para acomodar todo el nuevo UI
content = content.replace("if (activeMenu === 'calendar') targetH = 135;", "if (activeMenu === 'calendar') targetH = 260;")


# 2. Reescribir completamente PanelRacha
old_panel = r"function PanelRacha\(\) \{.+?return \(.+?\);\n\}"

new_panel = """function PanelRacha() {
  const diasRacha = [
    { dia: 'L', activo: true, pasado: true },
    { dia: 'M', activo: true, pasado: true },
    { dia: 'M', activo: false, pasado: true },
    { dia: 'J', activo: true, hoy: true, pasado: false },
    { dia: 'V', activo: false, pasado: false },
    { dia: 'S', activo: false, pasado: false },
    { dia: 'D', activo: false, pasado: false },
  ];

  // Mock de 30 días para el mes (ej. Agosto)
  const mesMock = Array.from({ length: 30 }).map((_, i) => ({
    dia: i + 1,
    // Inventamos un patrón de actividad para que se vea orgánico
    completado: [1,2,3,5,6,8,9,10,11,15,16,18,19,20,22,23,24,25].includes(i + 1)
  }));

  // Calculamos hasta qué punto llenar la barra del termómetro (Jueves = índice 3)
  const progresoSemana = (3 / 6) * 100; 

  return (
    <View style={{ flex: 1, paddingHorizontal: 20, paddingTop: 5, paddingBottom: 15 }}>
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

      {/* 2. CALENDARIO GITHUB-STYLE (30 DÍAS) */}
      <View style={{ marginBottom: 25 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
          <Texto style={{ fontSize: 9, color: 'rgba(0,0,0,0.4)', fontFamily: 'Montserrat-Bold', letterSpacing: 1, textTransform: 'uppercase' }}>HISTORIAL · AGOSTO</Texto>
          <Texto style={{ fontSize: 9, color: 'rgba(0,0,0,0.4)', fontFamily: 'Montserrat-Bold', letterSpacing: 1, textTransform: 'uppercase' }}>60% LOGRADO</Texto>
        </View>
        
        {/* Rejilla de días */}
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 4 }}>
          {mesMock.map((d, i) => (
            <View key={i} style={[{ 
              width: '12.5%', 
              height: 12, 
              borderRadius: 3, 
              backgroundColor: d.completado ? '#F26D21' : 'rgba(0,0,0,0.04)',
              borderBottomWidth: d.completado ? 1 : 0,
              borderBottomColor: oscurecer('#F26D21', 0.5)
            }]} />
          ))}
        </View>
      </View>
      
      {/* 3. TERMÓMETRO SEMANAL */}
      <View style={{ position: 'relative' }}>
        <Texto style={{ fontSize: 9, color: 'rgba(0,0,0,0.4)', fontFamily: 'Montserrat-Bold', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 10 }}>SEMANA EN CURSO</Texto>
        
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
                backgroundColor: d.activo ? '#F26D21' : 'rgba(0,0,0,0.03)',
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
