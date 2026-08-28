import re

with open('/home/arch-i7/Proyects/app/src/modulos/senderos/pantallas/SenderosPantalla.tsx', 'r') as f:
    code = f.read()

old_close = """            <Texto style={styles.estadoSubtitulo}>
              {emptyStateSub}
            </Texto>
          </RecuadroGlass>
        </View>
      </View>"""
new_close = """            <Texto style={styles.estadoSubtitulo}>
              {emptyStateSub}
            </Texto>
          </RecuadroGlass>
        </Reanimated.View>
      </View>"""
code = code.replace(old_close, new_close)

with open('/home/arch-i7/Proyects/app/src/modulos/senderos/pantallas/SenderosPantalla.tsx', 'w') as f:
    f.write(code)

