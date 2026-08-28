import re

with open('/home/arch-i7/Proyects/app/src/modulos/senderos/paginas/CompartidosSenderos.tsx', 'r') as f:
    comp_code = f.read()

state_inject = """  const [mostrarMapa, setMostrarMapa] = useState(false);
  const [itemsCargados, setItemsCargados] = useState(0);

  useEffect(() => {
    let timeout: any;
    if (itemsCargados < senderosCompartidosMock.length) {
      timeout = setTimeout(() => {
        setItemsCargados(prev => prev + 1);
      }, 75);
    }
    return () => clearTimeout(timeout);
  }, [itemsCargados]);"""

comp_code = comp_code.replace("  const [mostrarMapa, setMostrarMapa] = useState(false);", state_inject)

old_libros = """          {senderosCompartidosMock.map((sendero, index) => {
            const isActive = index === indiceActivo;
            const isDimmed = !isActive && indiceActivo !== -1;
            return (
              <Libro
                index={index}
                isActive={isActive}
                isDimmed={isDimmed}
                key={sendero.id}
                onPress={() => handleSeleccionarLibro(index)}
                sendero={sendero}
              />
            );
          })}"""

new_libros = """          {senderosCompartidosMock.map((sendero, index) => {
            if (index >= itemsCargados) {
              return <View key={`skeleton-${sendero.id}`} style={{ width: 44, height: 60, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 4, marginHorizontal: 8 }} />;
            }
            const isActive = index === indiceActivo;
            const isDimmed = !isActive && indiceActivo !== -1;
            return (
              <Libro
                index={index}
                isActive={isActive}
                isDimmed={isDimmed}
                key={sendero.id}
                onPress={() => handleSeleccionarLibro(index)}
                sendero={sendero}
              />
            );
          })}"""
comp_code = comp_code.replace(old_libros, new_libros)

with open('/home/arch-i7/Proyects/app/src/modulos/senderos/paginas/CompartidosSenderos.tsx', 'w') as f:
    f.write(comp_code)

