import re

with open('/home/arch-i7/Proyects/app/src/modulos/senderos/paginas/analisis/rutinas/RutinasAnalisis.tsx', 'r') as f:
    acode = f.read()

# Add MapaCalor import
if "import { MapaCalor }" not in acode:
    acode = acode.replace("import { Texto, RecuadroGlass, colores } from '../../../../../diseno';", "import { Texto, RecuadroGlass, colores } from '../../../../../diseno';\nimport { MapaCalor } from './MapaCalor';")

# Restructure the component body
hook_spot = "return ("
new_hook_spot = """if (senderoFiltro === null) {
    return (
      <View style={styles.raiz}>
        {itemsCargados < 1 ? (
          <View style={[styles.skeleton, { height: 260 }]} />
        ) : (
          <Reanimated.View entering={FadeInDown.duration(400)}>
            <RecuadroGlass blur intensity={40} style={[styles.panel, { borderColor: conAlpha(acento, '20') }]}>
              <View style={styles.cabeceraPanel}>
                <View>
                  <Texto style={styles.titulo}>Consistencia Mensual</Texto>
                  <Texto style={styles.subtitulo}>Mapa de calor de tus rutinas</Texto>
                </View>
                <View style={[styles.iconoCaja, { backgroundColor: conAlpha(acento, '15') }]}>
                  <Activity color={acento} size={18} />
                </View>
              </View>
              <MapaCalor datos={datos.actividadReciente || []} acento={acento} />
            </RecuadroGlass>
          </Reanimated.View>
        )}

        {itemsCargados < 2 ? (
          <View style={[styles.skeleton, { height: 120 }]} />
        ) : (
          <Reanimated.View entering={FadeInDown.duration(400).delay(100)}>
            <RecuadroGlass blur intensity={40} style={[styles.panel, { borderColor: conAlpha(acento, '20') }]}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 12 }}>
                <Texto style={[styles.numeroGigante, { color: colores.texto }]}>
                  78<Texto style={{ fontSize: 16, color: colores.textoSecundario }}>%</Texto>
                </Texto>
                <Texto style={styles.subtitulo}>Tasa Global de Cumplimiento</Texto>
              </View>
              <View style={styles.barraFondo}>
                <Reanimated.View style={[styles.barraRelleno, estiloNeon, { backgroundColor: acento, width: '78%', overflow: 'hidden' }]}>
                  <Reanimated.View style={[{ width: 4, height: '100%', backgroundColor: '#FFFFFF', position: 'absolute', top: 0, left: 0, opacity: 0.8, borderRadius: 2, shadowColor: '#FFF', shadowOpacity: 1, shadowRadius: 4 }, beamStyleH]} />
                </Reanimated.View>
              </View>
            </RecuadroGlass>
          </Reanimated.View>
        )}
      </View>
    );
  }

  // VISTA INDIVIDUAL (Rayos X)
  return ("""

acode = acode.replace("  return (", new_hook_spot, 1)

with open('/home/arch-i7/Proyects/app/src/modulos/senderos/paginas/analisis/rutinas/RutinasAnalisis.tsx', 'w') as f:
    f.write(acode)

