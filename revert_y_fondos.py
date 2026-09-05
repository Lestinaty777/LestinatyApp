import re

with open('/home/arch-i7/Proyects/app/src/modulos/inicio/pantallas/InicioPantalla.tsx', 'r') as f:
    content = f.read()

# 1. Eliminar importaciones de RNAnimated
content = content.replace("import { StyleSheet, View, useWindowDimensions, Pressable, ScrollView, Animated as RNAnimated, Easing as RNEasing } from 'react-native';", "import { StyleSheet, View, useWindowDimensions, Pressable, ScrollView } from 'react-native';")

# 2. Reemplazar FondoAnimado por FondoGeometrico (estático)
fondo_animado_old_regex = r"const AnimatedPattern = RNAnimated\.createAnimatedComponent\(Pattern\);\s*function FondoAnimado.+?(?=const TexturaPixelArt)"
fondo_geometrico_new = """function FondoGeometrico({ idAsignatura, color }: { idAsignatura: string, color: string }) {
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <Svg width="100%" height="100%">
        <Defs>
          {idAsignatura === '1' && (
            <Pattern id="pat_static_1" width={40} height={40} patternUnits="userSpaceOnUse">
              <Path d="M0,40 L40,0" stroke="#ffffff" strokeWidth={2.4} opacity={0.3} />
            </Pattern>
          )}
          {idAsignatura === '2' && (
            <Pattern id="pat_static_2" width={58} height={58} patternUnits="userSpaceOnUse">
              <Circle cx={29} cy={29} r={10} fill="none" stroke="#ffffff" strokeWidth={2.4} opacity={0.3} />
            </Pattern>
          )}
          {idAsignatura === '3' && (
            <Pattern id="pat_static_3" width={40} height={40} patternUnits="userSpaceOnUse">
              <Path d="M20,4 L36,20 L20,36 L4,20 Z" fill="none" stroke="#ffffff" strokeWidth={2.2} opacity={0.3} />
            </Pattern>
          )}
        </Defs>
        <Rect width="100%" height="100%" fill={color} opacity={0.85} />
        {idAsignatura === '1' && <Rect width="100%" height="100%" fill="url(#pat_static_1)" />}
        {idAsignatura === '2' && <Rect width="100%" height="100%" fill="url(#pat_static_2)" />}
        {idAsignatura === '3' && <Rect width="100%" height="100%" fill="url(#pat_static_3)" />}
      </Svg>
    </View>
  );
}
"""
content = re.sub(fondo_animado_old_regex, fondo_geometrico_new, content, flags=re.DOTALL)

# 3. Restaurar TexturaPixelArt en la tarjeta principal
content = content.replace(
    "<FondoAnimado idAsignatura={asignatura.id} color={asignatura.color} />",
    "<TexturaPixelArt />"
)

# 4. Inyectar FondoGeometrico en el carrusel y ajustar estilos
card_old = """<Pressable key={asig.id} style={({pressed}) => [styles.tarjetaCarrusel, pressed && { opacity: 0.8, transform: [{ scale: 0.98 }] }]} onPress={() => { hapticSeguro('seleccion'); setAsignatura(asig); setMenuAbierto(false); }}>
                    <View style={[styles.iconoCarrusel, { backgroundColor: asig.color }]}>"""

card_new = """<Pressable key={asig.id} style={({pressed}) => [styles.tarjetaCarrusel, { overflow: 'hidden' }, pressed && { opacity: 0.8, transform: [{ scale: 0.98 }] }]} onPress={() => { hapticSeguro('seleccion'); setAsignatura(asig); setMenuAbierto(false); }}>
                    <FondoGeometrico idAsignatura={asig.id} color={asig.color} />
                    <View style={[styles.iconoCarrusel, { backgroundColor: 'rgba(255,255,255,0.2)' }]}>"""
content = content.replace(card_old, card_new)

# Cambiar color de textos del carrusel a blanco para que contrasten con el fondo de color
content = content.replace("color: '#34312E',", "color: '#FFFFFF',")
content = content.replace("color: '#666',", "color: 'rgba(255,255,255,0.8)',")


with open('/home/arch-i7/Proyects/app/src/modulos/inicio/pantallas/InicioPantalla.tsx', 'w') as f:
    f.write(content)
