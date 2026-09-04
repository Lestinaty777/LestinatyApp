import re

with open('/home/arch-i7/Proyects/app/src/modulos/inicio/pantallas/InicioPantalla.tsx', 'r') as f:
    content = f.read()

pixel_old = """const PIXEL_SIZE = 8;
const patternPixels = Array.from({ length: 64 }).map((_, i) => {
  const x = (i % 8) * PIXEL_SIZE;
  const y = Math.floor(i / 8) * PIXEL_SIZE;
  const isLight = Math.random() > 0.5;
  const opacity = Math.random() * 0.15; // Sutil
  return { x, y, fill: isLight ? '#FFFFFF' : '#000000', opacity };
});

function TexturaPixelArt() {
  return (
    <Svg style={StyleSheet.absoluteFill}>
      <Defs>
        <Pattern id="pixel-pattern" width={64} height={64} patternUnits="userSpaceOnUse">
          {patternPixels.map((p, i) => (
            <Rect key={i} x={p.x} y={p.y} width={PIXEL_SIZE} height={PIXEL_SIZE} fill={p.fill} opacity={p.opacity} />
          ))}
        </Pattern>
      </Defs>
      <Rect width="100%" height="100%" fill="url(#pixel-pattern)" />
    </Svg>
  );
}"""

pixel_new = """const PIXEL_SIZE = 12;
const GRID_SIZE = 6; // 6x6 = 36 pixeles
const PATTERN_SIZE = PIXEL_SIZE * GRID_SIZE; // 72

// Generamos la opacidad fija para evitar subpixeles o blur
const patternPixels = Array.from({ length: GRID_SIZE * GRID_SIZE }).map((_, i) => {
  const x = (i % GRID_SIZE) * PIXEL_SIZE;
  const y = Math.floor(i / GRID_SIZE) * PIXEL_SIZE;
  const isLight = Math.random() > 0.5;
  // Usamos pasos discretos para la opacidad (0.05, 0.1, 0.15, 0.2)
  const opacity = Math.floor(Math.random() * 4 + 1) * 0.05; 
  return { x, y, fill: isLight ? '#FFFFFF' : '#000000', opacity };
});

function TexturaPixelArt() {
  return (
    <Svg width="100%" height="100%" style={StyleSheet.absoluteFill}>
      <Defs>
        <Pattern id="pixel-pattern" width={PATTERN_SIZE} height={PATTERN_SIZE} patternUnits="userSpaceOnUse">
          {patternPixels.map((p, i) => (
            <Rect key={i} x={p.x} y={p.y} width={PIXEL_SIZE} height={PIXEL_SIZE} fill={p.fill} opacity={p.opacity} />
          ))}
        </Pattern>
      </Defs>
      <Rect width="100%" height="100%" fill="url(#pixel-pattern)" />
    </Svg>
  );
}"""

content = content.replace(pixel_old, pixel_new)

# Make sure the texture is also in the base if the user meant the WHOLE card
card_old = """        <View style={styles.tarjetaContenedor}>
          <View style={[styles.tarjetaAsignaturaBase, { backgroundColor: oscurecer(biomas.inicio.MasterColor, 0.6) }]} />
          <View style={[styles.tarjetaAsignatura, { backgroundColor: biomas.inicio.MasterColor }]}>
            <TexturaPixelArt />"""
card_new = """        <View style={styles.tarjetaContenedor}>
          <View style={[styles.tarjetaAsignaturaBase, { backgroundColor: oscurecer(biomas.inicio.MasterColor, 0.6) }]}>
            <View style={{...StyleSheet.absoluteFillObject, overflow: 'hidden', borderRadius: 26}}>
               <TexturaPixelArt />
            </View>
          </View>
          <View style={[styles.tarjetaAsignatura, { backgroundColor: biomas.inicio.MasterColor }]}>
            <TexturaPixelArt />"""
content = content.replace(card_old, card_new)

with open('/home/arch-i7/Proyects/app/src/modulos/inicio/pantallas/InicioPantalla.tsx', 'w') as f:
    f.write(content)

