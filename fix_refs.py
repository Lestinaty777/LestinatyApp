import re

with open('/home/arch-i7/Proyects/app/src/modulos/senderos/paginas/MapaCompartido.tsx', 'r') as f:
    mapa_code = f.read()

old_state = "  const [nodoSeleccionado, setNodoSeleccionado] = React.useState<string | null>(null);"
new_state = """  const [nodoSeleccionado, setNodoSeleccionado] = React.useState<string | null>(null);
  const scrollViewRef = useRef<ScrollView>(null);
  const { height: windowHeight } = Dimensions.get('window');

  const handleNodoPress = (nodoId: string, yPos: number) => {
    if (nodoSeleccionado === nodoId) {
      setNodoSeleccionado(null);
    } else {
      setNodoSeleccionado(nodoId);
      // Auto Scroll to center the node
      const targetY = yPos - (windowHeight / 2) + 120; // 120 extra offset so tooltip fits well
      scrollViewRef.current?.scrollTo({ y: Math.max(0, targetY), animated: true });
    }
  };"""
mapa_code = mapa_code.replace(old_state, new_state)

with open('/home/arch-i7/Proyects/app/src/modulos/senderos/paginas/MapaCompartido.tsx', 'w') as f:
    f.write(mapa_code)
