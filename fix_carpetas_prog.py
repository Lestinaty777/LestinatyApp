import re

with open('/home/arch-i7/Proyects/app/src/modulos/senderos/pantallas/SenderosPantalla.tsx', 'r') as f:
    send_code = f.read()

# Add itemsCargados to CarpetaGiganteSenderos
target_func = "function CarpetaGiganteSenderos({ categoriaAbierta, setCategoriaAbierta }: { categoriaAbierta: string, setCategoriaAbierta: React.Dispatch<React.SetStateAction<string>> }) {\n  const entradaCarpeta = useRef(new Animated.Value(0)).current;"
new_func = """function CarpetaGiganteSenderos({ categoriaAbierta, setCategoriaAbierta }: { categoriaAbierta: string, setCategoriaAbierta: React.Dispatch<React.SetStateAction<string>> }) {
  const [itemsCargados, setItemsCargados] = useState(0);

  useEffect(() => {
    let timeout: any;
    if (itemsCargados < categoriasCarpeta.length) {
      timeout = setTimeout(() => {
        setItemsCargados(prev => prev + 1);
      }, 55); // A bit faster for tabs so it feels snappy
    }
    return () => clearTimeout(timeout);
  }, [itemsCargados]);

  const entradaCarpeta = useRef(new Animated.Value(0)).current;"""
send_code = send_code.replace(target_func, new_func)

# Replace tabs (separadores) mapping
old_separadores = """      <View style={styles.pestanasColorCarpeta}>
        {categoriasCarpeta.map((categoria) => (
          <SeparadorColorCarpeta
            key={categoria.id}
            activo={categoriaAbierta === categoria.id}
            categoria={categoria}
            onPress={() => alternarCategoria(categoria.id)}
          />
        ))}
      </View>"""
new_separadores = """      <View style={styles.pestanasColorCarpeta}>
        {categoriasCarpeta.map((categoria, index) => {
          if (index >= itemsCargados) {
            return (
              <View 
                key={`skel-sep-${categoria.id}`} 
                style={{ width: 44, height: 44, backgroundColor: 'rgba(255,255,255,0.08)', borderTopLeftRadius: 14, borderTopRightRadius: 14, marginRight: 2 }} 
              />
            );
          }
          return (
            <SeparadorColorCarpeta
              key={categoria.id}
              activo={categoriaAbierta === categoria.id}
              categoria={categoria}
              onPress={() => alternarCategoria(categoria.id)}
            />
          );
        })}
      </View>"""
send_code = send_code.replace(old_separadores, new_separadores)

# Replace rows (filas) mapping
old_filas = """          <Animated.View style={[styles.filasCarpeta, { opacity: progresoModo, transform: [{ translateY: desplazamientoModo }] }]}>
            {categoriasCarpeta.map((categoria) => (
              <FilaCategoriaCarpeta
                key={categoria.id}
                abierta={categoriaAbierta === categoria.id}
                categoria={categoria}
                onPress={() => alternarCategoria(categoria.id)}
              />
            ))}
          </Animated.View>"""
new_filas = """          <Animated.View style={[styles.filasCarpeta, { opacity: progresoModo, transform: [{ translateY: desplazamientoModo }] }]}>
            {categoriasCarpeta.map((categoria, index) => {
              if (index >= itemsCargados) {
                return (
                  <View 
                    key={`skel-fila-${categoria.id}`} 
                    style={{ width: '100%', height: 72, backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 20, marginBottom: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' }} 
                  />
                );
              }
              return (
                <FilaCategoriaCarpeta
                  key={categoria.id}
                  abierta={categoriaAbierta === categoria.id}
                  categoria={categoria}
                  onPress={() => alternarCategoria(categoria.id)}
                />
              );
            })}
          </Animated.View>"""
send_code = send_code.replace(old_filas, new_filas)

with open('/home/arch-i7/Proyects/app/src/modulos/senderos/pantallas/SenderosPantalla.tsx', 'w') as f:
    f.write(send_code)

