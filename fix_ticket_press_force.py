import re

with open('/home/arch-i7/Proyects/app/src/modulos/inicio/pantallas/InicioPantalla.tsx', 'r') as f:
    content = f.read()

old_ticket_regex = r"if \(asig\.id === '1'\) \{.+?return \(.+?<\/Pressable>\n\s*\);\n\s*\}"

new_ticket = """if (asig.id === '1') {
                    const w = 140;
                    const h = 85;
                    const path = `M 0,0 L 95,0 A 8,8 0 0,0 111,0 L ${w},0 L ${w},${h} L 111,${h} A 8,8 0 0,0 95,${h} L 0,${h} Z`;
                    
                    return (
                      <Pressable key={asig.id} style={[{ width: w, height: h + 4 }]} onPress={() => { hapticSeguro('seleccion'); setAsignatura(asig); setMenuAbierto(false); }}>
                        {({ pressed }) => (
                          <>
                            {/* Capa Base: Sombra 3D Sólida */}
                            <View style={StyleSheet.absoluteFill} pointerEvents="none">
                              <Svg width="100%" height="100%" viewBox={`0 0 ${w} ${h + 4}`}>
                                <Path d={path} fill="rgba(0,0,0,0.2)" transform="translate(0, 4)" />
                              </Svg>
                            </View>

                            {/* Capa Principal: Se hunde 4px cuando está presionada */}
                            <View style={[StyleSheet.absoluteFill, { transform: [{ translateY: pressed ? 4 : 0 }] }]}>
                              
                              <View style={StyleSheet.absoluteFill} pointerEvents="none">
                                <Svg width="100%" height="100%" viewBox={`0 0 ${w} ${h + 4}`}>
                                  {/* Cuerpo del Boleto */}
                                  <Path d={path} fill={asig.color} />
                                  
                                  {/* Línea punteada de desgarre */}
                                  <Line x1="103" y1="12" x2="103" y2={h - 12} stroke="rgba(255,255,255,0.4)" strokeWidth="1.5" strokeDasharray="3 3" />
                                  
                                  {/* Simulación de Código de Barras en el Stub (Derecha) */}
                                  <Rect x="118" y="25" width="2" height="35" fill="rgba(255,255,255,0.6)" />
                                  <Rect x="122" y="25" width="4" height="35" fill="rgba(255,255,255,0.6)" />
                                  <Rect x="128" y="25" width="1" height="35" fill="rgba(255,255,255,0.6)" />
                                  <Rect x="131" y="25" width="3" height="35" fill="rgba(255,255,255,0.6)" />
                                </Svg>
                                {/* Pequeño texto en el stub inferior derecho */}
                                <TextoRN style={{ position: 'absolute', right: 8, bottom: 8, fontSize: 7, color: 'rgba(255,255,255,0.6)', fontFamily: 'Montserrat-Bold' }}>Nº 01</TextoRN>
                              </View>
                              
                              {/* Textura pixel art enmascarada */}
                              <View style={{ position: 'absolute', left: 0, top: 0, width: 103, height: h, overflow: 'hidden', opacity: 0.3 }} pointerEvents="none">
                                <TexturaPixelArt />
                              </View>

                              {/* Brillo diagonal rasante (Infinito) */}
                              <View style={[styles.tarjetaBrilloCarrusel, { top: -60, left: -20, height: 350, width: 25, backgroundColor: 'rgba(255,255,255,0.08)' }]} pointerEvents="none" />

                              {/* Icono Principal (Arriba Izquierda) */}
                              <View style={{ position: 'absolute', top: 12, left: 12 }}>
                                <asig.Icono />
                              </View>
                              
                              {/* Título y Label (Abajo Izquierda) */}
                              <View style={{ position: 'absolute', bottom: 12, left: 12, right: 45 }}>
                                <Texto style={{ fontSize: 6, color: 'rgba(255,255,255,0.6)', fontFamily: 'Montserrat-Bold', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 2 }} numberOfLines={1}>PASE DE ACCESO</Texto>
                                <Texto style={[styles.textoCarruselTitulo, { fontSize: 13, lineHeight: 14 }]}>{asig.titulo}</Texto>
                              </View>

                            </View>
                          </>
                        )}
                      </Pressable>
                    );
                  }"""

content = re.sub(old_ticket_regex, new_ticket, content, flags=re.DOTALL)

with open('/home/arch-i7/Proyects/app/src/modulos/inicio/pantallas/InicioPantalla.tsx', 'w') as f:
    f.write(content)
