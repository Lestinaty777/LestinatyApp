import re

with open('/home/arch-i7/Proyects/app/src/modulos/senderos/paginas/CompartidosSenderos.tsx', 'r') as f:
    code = f.read()

# 1. Update export
old_export = "export function CompartidosSenderos() {"
new_export = "export function CompartidosSenderos({ onHeroDataChange }: { onHeroDataChange?: (data: any) => void }) {"
code = code.replace(old_export, new_export)

# 2. Add useEffect for onHeroDataChange
hook_spot = "const senderoActivo = senderosCompartidosMock[indiceActivo];"
new_hook_spot = "const senderoActivo = senderosCompartidosMock[indiceActivo];\n  useEffect(() => {\n    if (onHeroDataChange) onHeroDataChange(senderoActivo);\n  }, [senderoActivo]);"
code = code.replace(hook_spot, new_hook_spot)

# 3. Remove heroFogata section completely
hero_start = "{/* DYNAMIC HERO SECTION COMPACT */}"
hero_end = "      {/* LIBRERO PREMIUM Y LIBROS */}"
hero_regex = re.search(re.escape(hero_start) + r'.*?' + re.escape(hero_end), code, re.DOTALL)
if hero_regex:
    code = code.replace(hero_regex.group(0), hero_end)

with open('/home/arch-i7/Proyects/app/src/modulos/senderos/paginas/CompartidosSenderos.tsx', 'w') as f:
    f.write(code)

