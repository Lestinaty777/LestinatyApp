import re

with open('/home/arch-i7/Proyects/app/src/modulos/senderos/paginas/ActivosSenderos.tsx', 'r') as f:
    act_code = f.read()

# Remove the useEffect from the top
bad_effect = """  // Carga Progresiva (Skeleton)
  const [itemsCargados, setItemsCargados] = useState(0);
  useEffect(() => {
    let timeout: any;
    if (itemsCargados < senderosFiltrados.length) {
      timeout = setTimeout(() => {
        setItemsCargados(prev => prev + 1);
      }, 75);
    }
    return () => clearTimeout(timeout);
  }, [itemsCargados, senderosFiltrados.length]);"""
act_code = act_code.replace(bad_effect, "")

# Find where it should go
marker = "  const indiceActivo = senderosFiltrados.findIndex((s) => s.id === senderoExpandidoId);"
good_effect = """  // Carga Progresiva (Skeleton)
  const [itemsCargados, setItemsCargados] = useState(0);
  useEffect(() => {
    let timeout: any;
    if (itemsCargados < senderosFiltrados.length) {
      timeout = setTimeout(() => {
        setItemsCargados(prev => prev + 1);
      }, 75);
    }
    return () => clearTimeout(timeout);
  }, [itemsCargados, senderosFiltrados.length]);
  
  useEffect(() => { setItemsCargados(0); }, [filtroActivo]);\n\n"""

act_code = act_code.replace(marker, marker + "\n\n" + good_effect)

with open('/home/arch-i7/Proyects/app/src/modulos/senderos/paginas/ActivosSenderos.tsx', 'w') as f:
    f.write(act_code)

