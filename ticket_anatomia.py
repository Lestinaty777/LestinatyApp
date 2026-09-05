import re

with open('/home/arch-i7/Proyects/app/src/modulos/inicio/pantallas/InicioPantalla.tsx', 'r') as f:
    content = f.read()

# Make sure Line is imported from react-native-svg
if "Line" not in content.split("from 'react-native-svg'")[0]:
    content = content.replace("Path, Circle } from 'react-native-svg';", "Path, Circle, Line } from 'react-native-svg';")

# Replace the mapping inside ASIGNATURAS.map to branch out for id == '1'
old_map = """                {ASIGNATURAS.map(asig => (
                  <Pressable key={asig.id} style={({pressed}) => [styles.tarjetaCarrusel, { overflow: 'hidden', backgroundColor: asig.color, borderColor: 'rgba(255,255,255,0.2)' }, pressed && { opacity: 0.8, transform: [{ scale: 0.98 }] }]} onPress={() => { hapticSeguro('seleccion'); setAsignatura(asig); setMenuAbierto(false); }}>
                    <TexturaPixelArt />
                    <View style={styles.tarjetaBrilloCarrusel} />
                    <View style={{ position: 'absolute', right: -15, bottom: -15, opacity: 0.12, zIndex: 0 }}>
                       {asig.id === '1' && <Activity size={42} color="#FFFFFF" />}
                       {asig.id === '2' && <Beaker size={42} color="#FFFFFF" />}
                       {asig.id === '3' && <Users size={42} color="#FFFFFF" />}
                    </View>
                    <View style={[styles.iconoCarrusel, { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
                      <asig.Icono />
                    </View>
                    <View style={{ flex: 1, justifyContent: 'flex-end', zIndex: 10 }}>
                      <Texto style={styles.textoCarruselTitulo}>{asig.titulo}</Texto>
                    </View>
                  </Pressable>
                ))}"""

new_map = """                {ASIGNATURAS.map(asig => {
                  if (asig.id === '1') {
                    return (
                      <Pressable key={asig.id} style={({pressed}) => [{ width: 120, height: 90, justifyContent: 'space-between', padding: 12 }, pressed && { opacity: 0.8, transform: [{ scale: 0.98 }] }]} onPress={() => { hapticSeguro('seleccion'); setAsignatura(asig); setMenuAbierto(false); }}>
                        
                        {/* Fondo SVG forma de Boleto */}
                        <View style={StyleSheet.absoluteFill} pointerEvents="none">
                          <Svg width="100%" height="100%" viewBox="0 0 120 90">
                            {/* Sombra ligera del boleto */}
                            <Path d="M 0,0 L 120,0 L 120,35 A 10,10 0 0,0 120,55 L 120,90 L 0,90 L 0,55 A 10,10 0 0,0 0,35 Z" fill={asig.color} />
                            
                            {/* Línea punteada de desgarre */}
                            <Line x1="12" y1="45" x2="108" y2="45" stroke="rgba(255,255,255,0.3)" strokeWidth="1.5" strokeDasharray="4 4" />
                          </Svg>
                        </View>
                        
                        {/* Textura pixel art enmascarada (opcional, la ponemos sobre el contenedor) */}
                        <View style={[StyleSheet.absoluteFill, { opacity: 0.5, overflow: 'hidden', borderRadius: 8 }]} pointerEvents="none">
                          <TexturaPixelArt />
                        </View>

                        {/* Brillo diagonal */}
                        <View style={[styles.tarjetaBrilloCarrusel, { top: -20, left: 10, height: 150, width: 25 }]} pointerEvents="none" />

                        {/* Icono Principal (Arriba) */}
                        <View style={[styles.iconoCarrusel, { backgroundColor: 'transparent', alignSelf: 'center', marginBottom: 0 }]}>
                          <asig.Icono />
                        </View>
                        
                        {/* Título (Abajo) */}
                        <View style={{ alignItems: 'center', justifyContent: 'center', marginTop: 10 }}>
                          <Texto style={[styles.textoCarruselTitulo, { textAlign: 'center' }]}>{asig.titulo}</Texto>
                        </View>

                      </Pressable>
                    );
                  }

                  return (
                    <Pressable key={asig.id} style={({pressed}) => [styles.tarjetaCarrusel, { overflow: 'hidden', backgroundColor: asig.color, borderColor: 'rgba(255,255,255,0.2)' }, pressed && { opacity: 0.8, transform: [{ scale: 0.98 }] }]} onPress={() => { hapticSeguro('seleccion'); setAsignatura(asig); setMenuAbierto(false); }}>
                      <TexturaPixelArt />
                      <View style={styles.tarjetaBrilloCarrusel} />
                      <View style={{ position: 'absolute', right: -15, bottom: -15, opacity: 0.12, zIndex: 0 }}>
                         {asig.id === '2' && <Beaker size={42} color="#FFFFFF" />}
                         {asig.id === '3' && <Users size={42} color="#FFFFFF" />}
                      </View>
                      <View style={[styles.iconoCarrusel, { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
                        <asig.Icono />
                      </View>
                      <View style={{ flex: 1, justifyContent: 'flex-end', zIndex: 10 }}>
                        <Texto style={styles.textoCarruselTitulo}>{asig.titulo}</Texto>
                      </View>
                    </Pressable>
                  );
                })}"""

content = content.replace(old_map, new_map)

with open('/home/arch-i7/Proyects/app/src/modulos/inicio/pantallas/InicioPantalla.tsx', 'w') as f:
    f.write(content)
