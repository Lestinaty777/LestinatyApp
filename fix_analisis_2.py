import re

with open('/home/arch-i7/Proyects/app/src/modulos/senderos/paginas/AnalisisSenderos.tsx', 'r') as f:
    code = f.read()

# Fix the stray closing tag
code = code.replace("      </RecuadroGlass>\n      </Reanimated.View>\n\n      <Reanimated.View key={'rit-'", "      </RecuadroGlass>\n\n      <Reanimated.View key={'rit-'")

# Add the start tag properly
old_res = "      <RecuadroGlass blur intensity={64} style={[styles.resumenGlass, { borderColor: conAlpha(categoria.acento, '32') }]}>"
new_res = "      <Reanimated.View key={'res-' + categoria.id} entering={FadeInDown.delay(100).duration(400)}>\n      <RecuadroGlass blur intensity={64} style={[styles.resumenGlass, { borderColor: conAlpha(categoria.acento, '32') }]}>"
code = code.replace(old_res, new_res)

# Add the closing tag properly
old_res_close = "      </RecuadroGlass>\n\n      <Reanimated.View key={'rit-'"
new_res_close = "      </RecuadroGlass>\n      </Reanimated.View>\n\n      <Reanimated.View key={'rit-'"
code = code.replace(old_res_close, new_res_close)

with open('/home/arch-i7/Proyects/app/src/modulos/senderos/paginas/AnalisisSenderos.tsx', 'w') as f:
    f.write(code)

