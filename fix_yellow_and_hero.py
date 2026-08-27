import re

with open('/home/arch-i7/Proyects/app/src/modulos/senderos/paginas/CompartidosSenderos.tsx', 'r') as f:
    content = f.read()

# 1. Change the front lip to yellow almost beige
content = content.replace('stopColor="#FF4A00"', 'stopColor="#F0D49C"')
content = content.replace('stopColor="#CC3600"', 'stopColor="#D4B67A"')
# Rename redLip to yellowLip (optional, but good for clarity)
content = content.replace('id="redLip"', 'id="yellowLip"')
content = content.replace('url(#redLip)', 'url(#yellowLip)')

# 2. Replace Hero Section
old_hero = """      {/* HERO SECTION - FOGATA */}
      <View style={styles.heroFogata}>
        <View style={styles.heroTinte} />
        <View style={styles.heroTexto}>
          <Texto style={styles.heroEtiqueta}>Alianzas</Texto>
          <Texto style={styles.heroTitulo}>Fogata de Sintonía</Texto>
          <Texto style={styles.heroSubtitulo}>
            Únete a otros exploradores y mantengan viva la llama del progreso.
          </Texto>
        </View>
        <View style={styles.fogataCentro}>
          <View style={styles.fogataPulso} />
          <View style={styles.fogataOrbita}>
            <Flame color={Bioma.MasterColor} fill="rgba(95,193,62,0.2)" size={38} strokeWidth={1.5} />
          </View>
        </View>
      </View>"""

new_hero = """      {/* DYNAMIC HERO SECTION */}
      {senderoActivo && (
      <RNAnimated.View style={[styles.heroFogata, { opacity: opacidadBitacora }]}>
        <View style={[styles.heroTinte, { backgroundColor: senderoActivo.acento, opacity: 0.08 }]} />
        <View style={styles.heroTexto}>
          <Texto style={[styles.heroEtiqueta, { color: senderoActivo.acento }]}>{senderoActivo.categoria}</Texto>
          <Texto style={styles.heroTitulo}>{senderoActivo.titulo}</Texto>
          <Texto style={styles.heroSubtitulo}>
            {senderoActivo.mensajeMotivacional || senderoActivo.descripcion}
          </Texto>
          
          <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 14, gap: 12 }}>
            <View style={{ flexDirection: 'row' }}>
              {senderoActivo.miembros.map((m, i) => (
                <View key={m.id} style={{
                  width: 26, height: 26, borderRadius: 13, backgroundColor: m.colorAvatar,
                  justifyContent: 'center', alignItems: 'center',
                  marginLeft: i > 0 ? -8 : 0, borderWidth: 1.5, borderColor: '#1A1A1A'
                }}>
                   <Texto style={{ fontSize: 9, fontFamily: 'MontserratAlternates-Bold', color: '#FFF' }}>{m.iniciales}</Texto>
                </View>
              ))}
            </View>
            <View style={{ backgroundColor: 'rgba(255,255,255,0.1)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 }}>
               <Texto style={{ fontSize: 10, fontFamily: 'MontserratAlternates-Bold', color: colores.texto }}>{senderoActivo.progresoPorcentaje}% Progreso</Texto>
            </View>
          </View>

        </View>
        <View style={styles.fogataCentro}>
          <View style={[styles.fogataPulso, { backgroundColor: senderoActivo.acento, opacity: 0.1, borderColor: senderoActivo.acento }]} />
          <View style={[styles.fogataOrbita, { borderColor: senderoActivo.acento, backgroundColor: 'rgba(255,255,255,0.3)' }]}>
             {React.createElement(iconosCategoria[senderoActivo.categoriaId] || Compass, {
               color: senderoActivo.acento,
               size: 34,
               strokeWidth: 2
             })}
          </View>
        </View>
      </RNAnimated.View>
      )}"""

content = content.replace(old_hero, new_hero)

with open('/home/arch-i7/Proyects/app/src/modulos/senderos/paginas/CompartidosSenderos.tsx', 'w') as f:
    f.write(content)

