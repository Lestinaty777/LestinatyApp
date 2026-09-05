import re

with open('/home/arch-i7/Proyects/app/src/modulos/inicio/pantallas/InicioPantalla.tsx', 'r') as f:
    content = f.read()

# Fix the start of the scrollview to be conditionally rendered
content = re.sub(
    r"<ScrollView horizontal showsHorizontalScrollIndicator=\{false\} contentContainerStyle=\{styles\.carruselSenderos\} style=\{\{ flex: 1 \}\}>",
    r"{activeMenu === 'courses' && (\n              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.carruselSenderos} style={{ flex: 1 }}>",
    content
)

# Fix the end of the scrollview to close the condition, and fix the malformed activeMenu string
content = content.replace(
    """              </ScrollView>

                {activeMenu === \\'calendar\\' && <PanelRacha />}
            </Animated.View>""",
    """              </ScrollView>\n              )}\n              {activeMenu === 'calendar' && <PanelRacha />}\n            </Animated.View>"""
)

with open('/home/arch-i7/Proyects/app/src/modulos/inicio/pantallas/InicioPantalla.tsx', 'w') as f:
    f.write(content)
