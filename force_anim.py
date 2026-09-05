import re

with open('/home/arch-i7/Proyects/app/src/modulos/inicio/pantallas/InicioPantalla.tsx', 'r') as f:
    content = f.read()

old_block = r"React\.useEffect\(\(\) => \{.+?\}\)\)\;"

new_block = """React.useEffect(() => {
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
  }));"""

content = re.sub(r"React\.useEffect\(\(\) => \{[\s\S]+?\}\)\);", new_block, content)

with open('/home/arch-i7/Proyects/app/src/modulos/inicio/pantallas/InicioPantalla.tsx', 'w') as f:
    f.write(content)
