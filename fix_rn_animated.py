import re

with open('/home/arch-i7/Proyects/app/src/modulos/inicio/pantallas/InicioPantalla.tsx', 'r') as f:
    content = f.read()

content = content.replace("const AnimatedPattern = Animated.createAnimatedComponent(Pattern);", "const AnimatedPattern = RNAnimated.createAnimatedComponent(Pattern);")
content = content.replace("const offset = React.useRef(new Animated.Value(0)).current;", "const offset = React.useRef(new RNAnimated.Value(0)).current;")
content = content.replace("Animated.loop(", "RNAnimated.loop(")
content = content.replace("Animated.timing(offset,", "RNAnimated.timing(offset,")
content = content.replace("Easing.linear,", "RNEasing.linear,")

with open('/home/arch-i7/Proyects/app/src/modulos/inicio/pantallas/InicioPantalla.tsx', 'w') as f:
    f.write(content)
