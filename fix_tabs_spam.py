import re

with open('/home/arch-i7/Proyects/app/src/modulos/senderos/pantallas/SenderosPantalla.tsx', 'r') as f:
    code = f.read()

# 1. Add ultimoTap ref
hook_spot = "  const progresoPestana = useRef(new Animated.Value(0)).current;"
new_hook_spot = """  const progresoPestana = useRef(new Animated.Value(0)).current;
  const ultimoTapPestana = useRef(0);

  const handleCambiarPestana = (id: PaginaSenderosId) => {
    const ahora = Date.now();
    if (ahora - ultimoTapPestana.current < 350) return; // Bloqueo Anti-Spam
    ultimoTapPestana.current = ahora;
    if (id === pestanaActiva) return;
    hapticSeleccion();
    setPestanaActiva(id);
  };"""
code = code.replace(hook_spot, new_hook_spot)

# 2. Update Pressable onPress
old_press = """                onPress={() => {
                  hapticSeleccion();
                  setPestanaActiva(id);
                }}"""
new_press = """                onPress={() => handleCambiarPestana(id)}"""
code = code.replace(old_press, new_press)

with open('/home/arch-i7/Proyects/app/src/modulos/senderos/pantallas/SenderosPantalla.tsx', 'w') as f:
    f.write(code)

