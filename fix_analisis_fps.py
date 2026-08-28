import re

with open('/home/arch-i7/Proyects/app/src/modulos/senderos/paginas/AnalisisSenderos.tsx', 'r') as f:
    acode = f.read()

# 1. Add itemsCargados state
hook_spot = "const categoriaId = (categoriaActiva as CategoriaId) || 'rutinas';"
new_hook_spot = """const categoriaId = (categoriaActiva as CategoriaId) || 'rutinas';
  
  const [itemsCargados, setItemsCargados] = useState(0);
  useEffect(() => {
    let timeout: any;
    if (itemsCargados < 5) {
      timeout = setTimeout(() => {
        setItemsCargados(prev => prev + 1);
      }, 65);
    }
    return () => clearTimeout(timeout);
  }, [itemsCargados]);"""
acode = acode.replace(hook_spot, new_hook_spot)

# 2. Section 1: Resumen Glass (Index 1)
old_res = "<Reanimated.View key={'res-' + categoria.id} entering={FadeInDown.delay(100).duration(400)}>"
new_res = "{itemsCargados < 1 ? <View style={[styles.resumenGlass, { backgroundColor: 'rgba(255,255,255,0.05)', height: 110, borderColor: 'rgba(255,255,255,0.1)' }]} /> : (\n      <Reanimated.View key={'res-' + categoria.id} entering={FadeInDown.duration(400)}>"
acode = acode.replace(old_res, new_res)
acode = acode.replace("</RecuadroGlass>\n      </Reanimated.View>", "</RecuadroGlass>\n      </Reanimated.View>\n      )}")

# 3. Section 2: Ritmo Glass (Index 2)
old_ritmo = "<Reanimated.View key={'rit-' + categoria.id} entering={FadeInDown.delay(200).duration(400)}>"
new_ritmo = "{itemsCargados < 2 ? <View style={[styles.ritmoGlass, { backgroundColor: 'rgba(255,255,255,0.05)', height: 140, borderColor: 'rgba(255,255,255,0.1)', marginTop: 12 }]} /> : (\n      <Reanimated.View key={'rit-' + categoria.id} entering={FadeInDown.duration(400)}>"
acode = acode.replace(old_ritmo, new_ritmo)
acode = acode.replace("</RecuadroGlass>\n      </Reanimated.View>\n\n      <Reanimated.View key={'sen-'", "</RecuadroGlass>\n      </Reanimated.View>\n      )}\n\n      <Reanimated.View key={'sen-'")

# 4. Section 3: Senales (Index 3)
old_senales = "<Reanimated.View key={'sen-' + categoria.id} entering={FadeInDown.delay(300).duration(400)} style={styles.senalesFila}>"
new_senales = "{itemsCargados < 3 ? <View style={[styles.senalesFila, { height: 102, marginTop: 12 }]}><View style={[styles.senalGlass, { backgroundColor: 'rgba(255,255,255,0.05)', borderColor: 'rgba(255,255,255,0.1)' }]} /><View style={[styles.senalGlass, { backgroundColor: 'rgba(255,255,255,0.05)', borderColor: 'rgba(255,255,255,0.1)' }]} /></View> : (\n      <Reanimated.View key={'sen-' + categoria.id} entering={FadeInDown.duration(400)} style={styles.senalesFila}>"
acode = acode.replace(old_senales, new_senales)
acode = acode.replace("</Reanimated.View>\n\n      <Reanimated.View key={'list-'", "</Reanimated.View>\n      )}\n\n      <Reanimated.View key={'list-'")

# 5. Section 4: Tablero (Index 4)
old_lista = "<Reanimated.View key={'list-' + categoria.id} entering={FadeInDown.delay(400).duration(400)}>"
new_lista = "{itemsCargados < 4 ? <View style={{ height: 200, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 21, borderColor: 'rgba(255,255,255,0.1)', borderWidth: 1, marginTop: 12 }} /> : (\n      <Reanimated.View key={'list-' + categoria.id} entering={FadeInDown.duration(400)}>"
acode = acode.replace(old_lista, new_lista)
acode = acode.replace("</RecuadroGlass>\n      </Reanimated.View>\n    </View>", "</RecuadroGlass>\n      </Reanimated.View>\n      )}\n    </View>")

# Remove the artificial Delays from Reanimated since we are staggering by time anyway via the progressive mount!
# Wait, I already removed them in the replacement strings (changed FadeInDown.delay(X) to FadeInDown.duration(400))!

with open('/home/arch-i7/Proyects/app/src/modulos/senderos/paginas/AnalisisSenderos.tsx', 'w') as f:
    f.write(acode)

