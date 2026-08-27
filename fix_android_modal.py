import re

with open('/home/arch-i7/Proyects/app/src/modulos/senderos/paginas/CompartidosSenderos.tsx', 'r') as f:
    content = f.read()

# 1. Move Modal outside ScrollView
# Find return <ScrollView ...>
content = content.replace("  return (\n    <ScrollView\n", "  return (\n    <>\n      <ScrollView\n")

# Find the end of ScrollView and Modal
old_end = """      {/* OVERLAY DEL MAPA COMPARTIDO */}
      <Modal visible={mostrarMapa} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setMostrarMapa(false)}>
        <View style={{ flex: 1, backgroundColor: colores.fondo }}>
          {/* BOTON CERRAR */}
          <Pressable 
            onPress={() => setMostrarMapa(false)} 
            style={{ position: 'absolute', top: 50, right: 20, zIndex: 99, padding: 12, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 30, borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)' }}
          >
            <Texto style={{ color: '#FFF', fontFamily: 'MontserratAlternates-Bold', fontSize: 12 }}>Cerrar Mapa</Texto>
          </Pressable>
          
          {senderoActivo && <MapaCompartido masterColor={senderoActivo.acento} />}
        </View>
      </Modal>
    </ScrollView>
  );"""

# Wait, my previous snippet showed:
#           <MapaCompartido masterColor={senderoActivo.acento} />
#         </View>
#       </Modal>
#     </ScrollView>
#   );

# Let's use regex to find the Modal and ScrollView closing tag
modal_regex = re.search(r'(\s*\{\/\* OVERLAY DEL MAPA COMPARTIDO \*\/\}.*?<\/Modal>\n\s*<\/ScrollView>\n\s*\);)', content, re.DOTALL)
if modal_regex:
    old_modal_block = modal_regex.group(1)
    new_modal_block = old_modal_block.replace("</Modal>\n    </ScrollView>", "</ScrollView>\n" + old_modal_block.split("</Modal>")[0].split("{/* OVERLAY DEL MAPA COMPARTIDO */}")[1] + "</Modal>\n    </>")
    
    # Wait, simple replace is safer:
    new_modal_str = old_modal_block.replace("    </ScrollView>", "") + "\n    </>"
    # Actually, we want Modal outside ScrollView.
    
    # Let's extract the Modal part.
    modal_only = re.search(r'(\s*\{\/\* OVERLAY DEL MAPA COMPARTIDO \*\/\}.*?<\/Modal>)', old_modal_block, re.DOTALL).group(1)
    new_end_block = "    </ScrollView>\n" + modal_only + "\n    </>\n  );"
    content = content.replace(old_modal_block, new_end_block)

# 2. Remove zIndex: -1 from accionGlow
content = content.replace("    transform: [{ scale: 1.05 }],\n    zIndex: -1,", "    transform: [{ scale: 1.05 }],")

with open('/home/arch-i7/Proyects/app/src/modulos/senderos/paginas/CompartidosSenderos.tsx', 'w') as f:
    f.write(content)

