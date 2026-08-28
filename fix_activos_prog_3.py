import re

with open('/home/arch-i7/Proyects/app/src/modulos/senderos/paginas/ActivosSenderos.tsx', 'r') as f:
    act_code = f.read()

# Reverse the bad replace if I ran it
bad_style = "  skeletonActivo: {\n    backgroundColor: 'rgba(255, 255, 255, 0.4)',\n    borderRadius: 24,\n    marginBottom: 16,\n    width: '100%',\n    borderColor: 'rgba(255, 255, 255, 0.2)',\n    borderWidth: 1,\n  },\n});"
act_code = act_code.replace(bad_style, "});")

# Apply style at the end of the file safely
if act_code.endswith("});\n"):
    act_code = act_code[:-4] + ",\n" + bad_style[:-4] + "\n});\n"
elif act_code.endswith("});"):
    act_code = act_code[:-3] + ",\n" + bad_style[:-4] + "\n});"

with open('/home/arch-i7/Proyects/app/src/modulos/senderos/paginas/ActivosSenderos.tsx', 'w') as f:
    f.write(act_code)

