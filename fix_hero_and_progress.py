import re

with open('/home/arch-i7/Proyects/app/src/modulos/senderos/paginas/CompartidosSenderos.tsx', 'r') as f:
    content = f.read()

# 1. Update imports
old_imports = """import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  interpolate,
} from 'react-native-reanimated';"""

new_imports = """import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  interpolate,
  withRepeat,
  Easing,
} from 'react-native-reanimated';"""
content = content.replace(old_imports, new_imports)

# 2. Insert components before Bioma
components = """
function Burbuja({ delay, size, duration, top }: any) {
  const translateX = useSharedValue(-20);
  React.useEffect(() => {
    const timeout = setTimeout(() => {
      translateX.value = withRepeat(
        withTiming(300, { duration, easing: Easing.linear }),
        -1, false
      );
    }, delay);
    return () => clearTimeout(timeout);
  }, [delay, duration, translateX]);

  const style = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  return <Animated.View style={[style, {
    position: 'absolute', top, width: size, height: size,
    borderRadius: size/2, backgroundColor: 'rgba(255,255,255,0.45)'
  }]} />;
}

function BarraProgresoLiquida({ porcentaje, color }: any) {
  const widthAnim = useSharedValue(0);
  React.useEffect(() => {
    widthAnim.value = withSpring(porcentaje, { damping: 15 });
  }, [porcentaje, widthAnim]);

  const barStyle = useAnimatedStyle(() => ({
    width: `${widthAnim.value}%`
  }));

  return (
    <View style={{ height: 14, backgroundColor: 'rgba(0,0,0,0.2)', borderRadius: 7, overflow: 'hidden', width: '100%', marginTop: 10, borderColor: 'rgba(255,255,255,0.15)', borderWidth: 1 }}>
      <Animated.View style={[barStyle, { height: '100%', backgroundColor: color, overflow: 'hidden' }]}>
        <Burbuja delay={0} size={6} duration={2500} top={4} />
        <Burbuja delay={600} size={4} duration={2000} top={1} />
        <Burbuja delay={1200} size={8} duration={3000} top={-2} />
        <Burbuja delay={1800} size={5} duration={2200} top={5} />
        <Burbuja delay={2400} size={3} duration={1800} top={2} />
      </Animated.View>
    </View>
  );
}

const Bioma ="""
content = content.replace('const Bioma =', components)

# 3. Replace Hero
old_hero = """      {/* DYNAMIC HERO SECTION */}
      {senderoActivo && (
      <RNAnimated.View style={[styles.heroFogata, { opacity: opacidadBitacora }]}>
        <View style={[styles.heroTinte, { backgroundColor: senderoActivo.acento, opacity: 0.08 }]} />
        <View style={styles.heroTexto}>
          <Texto style={[styles.heroEtiqueta, { color: senderoActivo.acento }]}>{senderoActivo.categoria}</Texto>
          <Texto style={styles.heroTitulo}>{senderoActivo.titulo}</Texto>
          <Texto style={styles.heroSubtitulo}>
            {senderoActivo.mensajeMotivacional || senderoActivo.descripcion}
          </Texto>
          
          <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 14, gap: 12 }}>
            <View style={{ flexDirection: 'row' }}>
              {senderoActivo.miembros.map((m, i) => (
                <View key={m.id} style={{
                  width: 26, height: 26, borderRadius: 13, backgroundColor: m.colorAvatar,
                  justifyContent: 'center', alignItems: 'center',
                  marginLeft: i > 0 ? -8 : 0, borderWidth: 1.5, borderColor: '#1A1A1A'
                }}>
                   <Texto style={{ fontSize: 9, fontFamily: 'MontserratAlternates-Bold', color: '#FFF' }}>{m.iniciales}</Texto>
                </View>
              ))}
            </View>
            <View style={{ backgroundColor: 'rgba(255,255,255,0.1)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 }}>
               <Texto style={{ fontSize: 10, fontFamily: 'MontserratAlternates-Bold', color: colores.texto }}>{senderoActivo.progresoPorcentaje}% Progreso</Texto>
            </View>
          </View>

        </View>
        <View style={styles.fogataCentro}>
          <View style={[styles.fogataPulso, { backgroundColor: senderoActivo.acento, opacity: 0.1, borderColor: senderoActivo.acento }]} />
          <View style={[styles.fogataOrbita, { borderColor: senderoActivo.acento, backgroundColor: 'rgba(255,255,255,0.3)' }]}>
             {React.createElement(iconosCategoria[senderoActivo.categoriaId] || Compass, {
               color: senderoActivo.acento,
               size: 34,
               strokeWidth: 2
             })}
          </View>
        </View>
      </RNAnimated.View>
      )}"""

new_hero = """      {/* DYNAMIC HERO SECTION COMPACT */}
      {senderoActivo && (
      <RNAnimated.View style={[styles.heroFogata, { opacity: opacidadBitacora }]}>
        <View style={[styles.heroTinte, { backgroundColor: senderoActivo.acento, opacity: 0.08 }]} />
        <View style={styles.heroTexto}>
          <Texto style={[styles.heroEtiqueta, { color: senderoActivo.acento, fontSize: 8 }]}>{senderoActivo.categoria}</Texto>
          <Texto style={[styles.heroTitulo, { fontSize: 18, marginTop: 0 }]}>{senderoActivo.titulo}</Texto>
          <Texto style={[styles.heroSubtitulo, { fontSize: 10, marginTop: 2 }]} numberOfLines={2}>
            {senderoActivo.descripcion}
          </Texto>
          
          <BarraProgresoLiquida porcentaje={senderoActivo.progresoPorcentaje} color={senderoActivo.acento} />
          
          <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 10, gap: 8 }}>
            <View style={{ flexDirection: 'row' }}>
              {senderoActivo.miembros.map((m, i) => (
                <View key={m.id} style={{
                  width: 22, height: 22, borderRadius: 11, backgroundColor: m.colorAvatar,
                  justifyContent: 'center', alignItems: 'center',
                  marginLeft: i > 0 ? -6 : 0, borderWidth: 1, borderColor: '#1A1A1A'
                }}>
                   <Texto style={{ fontSize: 7, fontFamily: 'MontserratAlternates-Bold', color: '#FFF' }}>{m.iniciales}</Texto>
                </View>
              ))}
            </View>
            <Texto style={{ fontSize: 9, fontFamily: 'MontserratAlternates-Bold', color: colores.textoSecundario }}>
               {senderoActivo.progresoPorcentaje}% Completado
            </Texto>
          </View>

        </View>
        <View style={[styles.fogataCentro, { transform: [{ scale: 0.85 }] }]}>
          <View style={[styles.fogataPulso, { backgroundColor: senderoActivo.acento, opacity: 0.1, borderColor: senderoActivo.acento }]} />
          <View style={[styles.fogataOrbita, { borderColor: senderoActivo.acento, backgroundColor: 'rgba(255,255,255,0.2)' }]}>
             {React.createElement(iconosCategoria[senderoActivo.categoriaId] || Compass, {
               color: senderoActivo.acento,
               size: 34,
               strokeWidth: 2
             })}
          </View>
        </View>
      </RNAnimated.View>
      )}"""

content = content.replace(old_hero, new_hero)

# 4. Modify styles for compact hero
content = content.replace('minHeight: 118,', 'minHeight: 90,')
content = content.replace('padding: 14,', 'padding: 10,')

with open('/home/arch-i7/Proyects/app/src/modulos/senderos/paginas/CompartidosSenderos.tsx', 'w') as f:
    f.write(content)
