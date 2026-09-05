import re

with open('/home/arch-i7/Proyects/app/src/modulos/inicio/pantallas/InicioPantalla.tsx', 'r') as f:
    content = f.read()

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

  return (
    <View style={{ flex: 1, paddingHorizontal: 20, paddingTop: 5, paddingBottom: 15 }}>
      {/* Background Texture para unificar con el estilo de los tickets */}
      <View style={[StyleSheet.absoluteFill, { opacity: 0.1 }]} pointerEvents="none">
        <TexturaPixelArt />
      </View>
      
      {/* Cabecera */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 18 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          {/* Badge 3D Brutalista (Igual a las tarjetas) */}
          <View style={{ width: 42, height: 42, borderRadius: 8, backgroundColor: '#F26D21', borderBottomWidth: 4, borderBottomColor: oscurecer('#F26D21', 0.6), justifyContent: 'center', alignItems: 'center' }}>
            <Flame color="#FFFFFF" size={24} fill="#FFFFFF" />
          </View>
          <View>
            <Texto style={{ fontSize: 9, color: 'rgba(0,0,0,0.5)', fontFamily: 'Montserrat-Bold', letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 0 }}>VITALIDAD</Texto>
            <Texto style={{ fontSize: 22, fontFamily: 'Montserrat-Bold', color: '#111111' }}>3 Días</Texto>
          </View>
        </View>
        <View style={{ alignItems: 'flex-end' }}>
          <Texto style={{ fontSize: 8, color: 'rgba(0,0,0,0.5)', fontFamily: 'Montserrat-Bold', letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 2 }}>XP SEMANAL</Texto>
          {/* Etiqueta XP Estilo Ticket */}
          <View style={{ backgroundColor: '#4A8BB3', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, borderBottomWidth: 2, borderBottomColor: oscurecer('#4A8BB3', 0.6) }}>
            <Texto style={{ fontSize: 13, fontFamily: 'Montserrat-Bold', color: '#FFFFFF' }}>+450</Texto>
          </View>
        </View>
      </View>
      
      {/* Strip de Días (Cajas 3D) */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 8 }}>
        {diasRacha.map((d, i) => (
          <View key={i} style={{ flex: 1, alignItems: 'center', gap: 6 }}>
            {/* Si está activo, es un botón 3D naranja saltado. Si no, es una ranura vacía. Hoy tiene borde extra grueso. */}
            <View style={[{ width: '100%', height: 35, borderRadius: 6, justifyContent: 'center', alignItems: 'center' }, 
              d.activo 
                ? { backgroundColor: '#F26D21', borderBottomWidth: 3, borderBottomColor: oscurecer('#F26D21', 0.6) } 
                : { backgroundColor: 'rgba(0,0,0,0.05)', borderWidth: 1, borderColor: 'rgba(0,0,0,0.1)' },
              d.hoy && { borderColor: '#111111', borderWidth: 2, borderBottomWidth: d.activo ? 3 : 2 }
            ]}>
               {d.activo && <Zap size={16} color="#FFF" fill="#FFF" />}
            </View>
            <Texto style={{ fontSize: 11, color: d.hoy ? '#111111' : (d.activo ? '#111111' : 'rgba(0,0,0,0.4)'), fontFamily: 'Montserrat-Bold' }}>{d.dia}</Texto>
          </View>
        ))}
      </View>
    </View>
  );
}"""

content = re.sub(old_panel, new_panel, content, flags=re.DOTALL)

with open('/home/arch-i7/Proyects/app/src/modulos/inicio/pantallas/InicioPantalla.tsx', 'w') as f:
    f.write(content)
