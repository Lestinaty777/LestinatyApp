import re

with open('/home/arch-i7/Proyects/app/src/modulos/inicio/pantallas/InicioPantalla.tsx', 'r') as f:
    content = f.read()

# Replace state
content = re.sub(
    r"const \[menuAbierto, setMenuAbierto\] = React\.useState\(false\);\n\s*const animMenu = useSharedValue\(0\);",
    r"""const [activeMenu, setActiveMenu] = React.useState<'none' | 'courses' | 'calendar'>('none');
  const animMenuState = useSharedValue(0);
  const animExpansionHeight = useSharedValue(0);

  const handleToggleMenu = (menu: 'courses' | 'calendar') => {
    hapticSeguro('seleccion');
    if (activeMenu === menu) {
      setActiveMenu('none');
    } else {
      setActiveMenu(menu);
    }
  };""",
    content
)

# Replace useEffect and animNavbarEstilos and animContenidoEstilos
content = re.sub(
    r"React\.useEffect\(\(\) => \{\n\s*animMenu\.value = withSpring\(menuAbierto \? 1 : 0, \{ damping: 16, stiffness: 100 \}\);\n\s*\}, \[menuAbierto\]\);\n\n\s*const animNavbarEstilos = useAnimatedStyle\(\(\) => \(\{\n\s*height: 62 \+ 115 \* animMenu\.value,\n\s*\}\)\);\n\n\s*const animContenidoEstilos = useAnimatedStyle\(\(\) => \(\{\n\s*opacity: animMenu\.value,\n\s*transform: \[\n\s*\{ translateY: -20 \* \(1 - animMenu\.value\) \}\n\s*\]\n\s*\}\)\);",
    r"""React.useEffect(() => {
    const isAnyOpen = activeMenu !== 'none';
    animMenuState.value = withSpring(isAnyOpen ? 1 : 0, { damping: 16, stiffness: 100 });
    
    let targetH = 0;
    if (activeMenu === 'courses') targetH = 115;
    if (activeMenu === 'calendar') targetH = 135;
    
    animExpansionHeight.value = withSpring(targetH, { damping: 16, stiffness: 100 });
  }, [activeMenu]);

  const animNavbarEstilos = useAnimatedStyle(() => ({
    height: 62 + animExpansionHeight.value,
  }));

  const animContenidoEstilos = useAnimatedStyle(() => ({
    opacity: animMenuState.value,
    transform: [
      { translateY: -20 * (1 - animMenuState.value) }
    ]
  }));""",
    content
)

with open('/home/arch-i7/Proyects/app/src/modulos/inicio/pantallas/InicioPantalla.tsx', 'w') as f:
    f.write(content)
