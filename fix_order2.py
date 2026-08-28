import re

with open('/home/arch-i7/Proyects/app/src/modulos/senderos/paginas/ActivosSenderos.tsx', 'r') as f:
    act_code = f.read()

# Add useState at the top where it belongs
top_marker = "  const [senderoExpandidoId, setSenderoExpandidoId] = useState<string | null>(null);"
act_code = act_code.replace(top_marker, top_marker + "\n  const [itemsCargados, setItemsCargados] = useState(0);")

# Remove the useState from good_effect
bad_hook = "  const [itemsCargados, setItemsCargados] = useState(0);\n"
act_code = act_code.replace(bad_hook, "", 1) # remove the one near the useEffect

with open('/home/arch-i7/Proyects/app/src/modulos/senderos/paginas/ActivosSenderos.tsx', 'w') as f:
    f.write(act_code)

