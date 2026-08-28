import re

with open('/home/arch-i7/Proyects/app/src/modulos/senderos/paginas/ActivosSenderos.tsx', 'r') as f:
    act_code = f.read()

# Add useCargaProgresiva to ActivosSenderos
old_state = "  const [senderoExpandidoId, setSenderoExpandidoId] = useState<string | null>(null);"
new_state = """  const [senderoExpandidoId, setSenderoExpandidoId] = useState<string | null>(null);

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
  }, [itemsCargados, senderosFiltrados.length]);"""

act_code = act_code.replace(old_state, new_state)

# Replace the map to use itemsCargados
old_lista = """        <View style={styles.listaActivos}>
          {senderosFiltrados.map((sendero) => (
            <TarjetaActivo
              compacta
              expandida={senderoExpandidoId === sendero.id}
              key={sendero.id}
              onAlternar={() => setSenderoExpandidoId((id) => id === sendero.id ? null : sendero.id)}
              sendero={sendero}
            />
          ))}
        </View>"""

new_lista = """        <View style={styles.listaActivos}>
          {senderosFiltrados.map((sendero, indice) => {
            if (indice >= itemsCargados) {
              return (
                <View key={`skeleton-${sendero.id}`} style={[styles.skeletonActivo, { height: 110 }]} />
              );
            }
            return (
              <TarjetaActivo
                compacta
                expandida={senderoExpandidoId === sendero.id}
                key={sendero.id}
                onAlternar={() => setSenderoExpandidoId((id) => id === sendero.id ? null : sendero.id)}
                sendero={sendero}
              />
            );
          })}
        </View>"""
act_code = act_code.replace(old_lista, new_lista)

# Add skeleton style
old_style_end = """    textTransform: 'uppercase',
  },
});"""
new_style_end = """    textTransform: 'uppercase',
  },
  skeletonActivo: {
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
    borderRadius: 24,
    marginBottom: 16,
    width: '100%',
    borderColor: 'rgba(255, 255, 255, 0.2)',
    borderWidth: 1,
  },
});"""
act_code = act_code.replace(old_style_end, new_style_end)

with open('/home/arch-i7/Proyects/app/src/modulos/senderos/paginas/ActivosSenderos.tsx', 'w') as f:
    f.write(act_code)

