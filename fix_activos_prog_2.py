import re

with open('/home/arch-i7/Proyects/app/src/modulos/senderos/paginas/ActivosSenderos.tsx', 'r') as f:
    act_code = f.read()

# 1. Move senderosFiltrados above the Carga Progresiva useEffect
# First, remove the bad useEffect block
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

# Find where senderosFiltrados is defined
filter_block_regex = re.search(r'(const senderosFiltrados = .*?\[filtroActivo\];)', act_code, re.DOTALL)
if filter_block_regex:
    filter_block = filter_block_regex.group(1)
    # Append the useEffect right after it
    new_filter_block = filter_block + """
  
  // Carga Progresiva (Skeleton)
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
  
  // Reset when filter changes
  useEffect(() => {
    setItemsCargados(0);
  }, [filtroActivo]);"""
    act_code = act_code.replace(filter_block, new_filter_block)

# 2. Add skeletonActivo properly
# Let's just append it to the file, removing the last });
act_code = act_code.replace("});", "  skeletonActivo: {\n    backgroundColor: 'rgba(255, 255, 255, 0.4)',\n    borderRadius: 24,\n    marginBottom: 16,\n    width: '100%',\n    borderColor: 'rgba(255, 255, 255, 0.2)',\n    borderWidth: 1,\n  },\n});")
# Wait, this will append it to EVERY }); again! We learned this lesson!
# Let's undo that replace if I can.
