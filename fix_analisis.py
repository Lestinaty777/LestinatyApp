import re

with open('/home/arch-i7/Proyects/app/src/modulos/senderos/paginas/AnalisisSenderos.tsx', 'r') as f:
    code = f.read()

# Add Reanimated import
if 'import Reanimated' not in code:
    code = code.replace("import { useState } from 'react';", "import { useState } from 'react';\nimport Reanimated, { FadeIn, FadeInDown } from 'react-native-reanimated';")

# 1. Wrap resumenGlass
old_res = """      <RecuadroGlass style={[styles.resumenGlass, { borderColor: conAlpha(categoria.acento, '20') }]}>"""
new_res = """      <Reanimated.View key={'res-' + categoria.id} entering={FadeInDown.delay(100).duration(400)}>
        <RecuadroGlass style={[styles.resumenGlass, { borderColor: conAlpha(categoria.acento, '20') }]}>"""
code = code.replace(old_res, new_res)
code = code.replace("      </RecuadroGlass>\n\n      <RecuadroGlass blur intensity={54} style={styles.ritmoGlass}>", "      </RecuadroGlass>\n      </Reanimated.View>\n\n      <RecuadroGlass blur intensity={54} style={styles.ritmoGlass}>")

# 2. Wrap ritmoGlass
old_ritmo = """<RecuadroGlass blur intensity={54} style={styles.ritmoGlass}>"""
new_ritmo = """<Reanimated.View key={'rit-' + categoria.id} entering={FadeInDown.delay(200).duration(400)}>
        <RecuadroGlass blur intensity={54} style={styles.ritmoGlass}>"""
code = code.replace(old_ritmo, new_ritmo)
code = code.replace("</RecuadroGlass>\n\n      <View style={styles.senalesFila}>", "</RecuadroGlass>\n      </Reanimated.View>\n\n      <View style={styles.senalesFila}>")

# 3. Wrap senalesFila
old_senales = """<View style={styles.senalesFila}>"""
new_senales = """<Reanimated.View key={'sen-' + categoria.id} entering={FadeInDown.delay(300).duration(400)} style={styles.senalesFila}>"""
code = code.replace(old_senales, new_senales)
code = code.replace("</View>\n\n      <View style={styles.listaCabecera}>", "</Reanimated.View>\n\n      <View style={styles.listaCabecera}>")

# 4. Wrap listaCabecera and tableroGlass
old_lista = """<View style={styles.listaCabecera}>
        <Texto style={styles.listaTitulo}>Senderos de {categoria.categoria}</Texto>
        <CalendarDays color={categoria.acento} size={16} strokeWidth={2.4} />
      </View>
      <RecuadroGlass blur intensity={50} style={styles.tableroGlass}>"""
new_lista = """<Reanimated.View key={'list-' + categoria.id} entering={FadeInDown.delay(400).duration(400)}>
      <View style={styles.listaCabecera}>
        <Texto style={styles.listaTitulo}>Senderos de {categoria.categoria}</Texto>
        <CalendarDays color={categoria.acento} size={16} strokeWidth={2.4} />
      </View>
      <RecuadroGlass blur intensity={50} style={styles.tableroGlass}>"""
code = code.replace(old_lista, new_lista)
code = code.replace("</RecuadroGlass>\n    </View>\n  );\n}", "</RecuadroGlass>\n      </Reanimated.View>\n    </View>\n  );\n}")

with open('/home/arch-i7/Proyects/app/src/modulos/senderos/paginas/AnalisisSenderos.tsx', 'w') as f:
    f.write(code)

