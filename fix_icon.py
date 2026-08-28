import re

with open('/home/arch-i7/Proyects/app/src/modulos/senderos/pantallas/SenderosPantalla.tsx', 'r') as f:
    code = f.read()

# Find the dynamic header logic block
target = "  let emptyStateSub = 'Crea tu primer camino y empieza a construir hábitos que te acerquen a tus metas.';"
new_target = "  let emptyStateSub = 'Crea tu primer camino y empieza a construir hábitos que te acerquen a tus metas.';\n  let EmptyIcon = Sprout;\n  let emptyIconColor = Bioma.MasterColor;\n  const catInfo = categoriasCarpeta.find(c => c.id === categoriaAbierta);\n  if (catInfo) {\n    EmptyIcon = catInfo.Icono;\n    emptyIconColor = catInfo.acento;\n  }"
code = code.replace(target, new_target)

# Replace Sprout in the empty state
old_sprout = "<Sprout color={Bioma.MasterColor} size={20} strokeWidth={2.4} />"
new_sprout = "<EmptyIcon color={emptyIconColor} size={20} strokeWidth={2.4} />"
code = code.replace(old_sprout, new_sprout)

with open('/home/arch-i7/Proyects/app/src/modulos/senderos/pantallas/SenderosPantalla.tsx', 'w') as f:
    f.write(code)

