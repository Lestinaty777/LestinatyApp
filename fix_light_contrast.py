import re

with open('/home/arch-i7/Proyects/app/src/modulos/inicio/pantallas/InicioPantalla.tsx', 'r') as f:
    content = f.read()

# 1. Revert tickets text
content = content.replace("color: 'rgba(255,255,255,0.95)'", "color: 'rgba(255,255,255,0.6)'")

# 2. Rewrite PanelRacha with LIGHT theme palette
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
      {/* Cabecera */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 18 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          {/* Badge Sólido */}
          <View style={{ width: 42, height: 42, borderRadius: 12, backgroundColor: '#F26D21', justifyContent: 'center', alignItems: 'center', shadowColor: '#F26D21', shadowOpacity: 0.3, shadowRadius: 6, shadowOffset: { width: 0, height: 3 } }}>
            <Flame color="#FFFFFF" size={24} fill="#FFFFFF" />
          </View>
          <View>
            <Texto style={{ fontSize: 9, color: 'rgba(0,0,0,0.5)', fontFamily: 'Montserrat-Bold', letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 0 }}>VITALIDAD</Texto>
            <Texto style={{ fontSize: 22, fontFamily: 'Montserrat-Bold', color: '#111111' }}>3 Días</Texto>
          </View>
        </View>
        <View style={{ alignItems: 'flex-end' }}>
          <Texto style={{ fontSize: 8, color: 'rgba(0,0,0,0.5)', fontFamily: 'Montserrat-Bold', letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 2 }}>XP SEMANAL</Texto>
          <Texto style={{ fontSize: 16, fontFamily: 'Montserrat-Bold', color: '#4A8BB3' }}>+450</Texto>
        </View>
      </View>
      
      {/* Strip de Días */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 8 }}>
        {diasRacha.map((d, i) => (
          <View key={i} style={{ flex: 1, alignItems: 'center', gap: 6 }}>
            <View style={[{ width: '100%', height: 35, borderRadius: 6, backgroundColor: d.activo ? '#F26D21' : 'rgba(0,0,0,0.06)', justifyContent: 'center', alignItems: 'center' }, d.hoy && { borderWidth: 2, borderColor: '#111111', backgroundColor: d.activo ? '#F26D21' : 'rgba(0,0,0,0.1)' }]}>
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
