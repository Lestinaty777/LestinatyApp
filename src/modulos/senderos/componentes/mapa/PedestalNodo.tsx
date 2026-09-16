import { BlurMask, Canvas, Group, Path as PathSkia } from '@shopify/react-native-skia';
import { Animated, StyleSheet } from 'react-native';
import { Defs, Ellipse, LinearGradient, Path, RadialGradient, Stop, Svg } from 'react-native-svg';

import { rotarPaletaHex } from '../../algoritmo/colorHsl';

const AnimatedEllipse = Animated.createAnimatedComponent(Ellipse);
type ValorAnimado = Animated.Value | Animated.AnimatedInterpolation<number>;

// El acento de blur del diseño de Figma (una línea difuminada bajo el botón)
// SÍ se puede lograr con blur real: react-native-svg trae <Filter>/
// <FeGaussianBlur> por dentro, pero son componentes de Fabric que Expo Go no
// tiene registrados (ver error "Could not find component config for native
// component"). Skia sí funciona en este proyecto — MasterChanger/AuroraBoreal
// ya lo usan — así que el acento se dibuja aparte, en un <Canvas> de Skia,
// reusando el mismo "d" del path de Figma tal cual, sin convertir nada.
const ACENTO_D = 'M70.5 255.5C130.166 286.732 163.34 288.259 230.5 255.5';

function AcentoBlur({ color, tamano }: { color: string; tamano: number }) {
  const escala = tamano / 302;
  return (
    <Canvas pointerEvents="none" style={[StyleSheet.absoluteFill, { height: tamano, width: tamano }]}>
      <Group opacity={0.4} transform={[{ scale: escala }]}>
        <PathSkia color={color} path={ACENTO_D} strokeWidth={7} style="stroke">
          <BlurMask blur={10} style="normal" />
        </PathSkia>
      </Group>
    </Canvas>
  );
}

// Pedestal + botón, tal cual el diseño de Figma del usuario (Group 3.svg) —
// se quitó el checkmark fijo (el ícono real va montado encima, dinámico según
// el paso). De las 3 elipses del botón, solo 2 son de color saturado de
// verdad: "Medio" (más oscura, el "socket") y "Superior" (más clara/vívida,
// donde se apoya el ícono). PedestalBase se queda quieta e incluye la elipse
// pálida de fondo + la elipse oscura (el socket fijo); PedestalBotonSuperior
// es la única pieza animada — al presionar baja hacia el socket, tapando el
// relieve 3D, igual que un botón de verdad.
const REFERENCIA_HUE = '#21A844';
const PALETA_BASE = ['#B4DC9B', '#DEFCDD', '#B2EEB1', '#44B042', '#248723', '#53C35D', '#21A844', '#69C068', '#28A116'] as const;

export function PedestalBase({ color, oscurecimiento, tamano = 84 }: { color: string; oscurecimiento?: ValorAnimado; tamano?: number }) {
  const [pedestalSolido, pedestalClaro, pedestalOscuro, botonMedioClaro, botonMedioOscuro, , , strokeEllipse, lineaBlur] =
    rotarPaletaHex(PALETA_BASE, REFERENCIA_HUE, color);

  return (
    <>
      <Svg height={tamano} style={StyleSheet.absoluteFill} viewBox="0 0 302 303" width={tamano}>
        <Defs>
          <LinearGradient gradientUnits="userSpaceOnUse" id="pedestalGrad" x1="150.75" x2="175.385" y1="51.1849" y2="285.699">
            <Stop offset="0.59697" stopColor={pedestalClaro} />
            <Stop offset="1" stopColor={pedestalOscuro} />
          </LinearGradient>
        </Defs>
        <Path d="M301.5 157.5C301.5 229.297 234.119 287.499 151 287.499C67.8811 287.499 0.5 229.297 0.5 157.5C32 210.5 72 255.5 151 260.5C216 260.5 278.5 208.5 301.5 157.5Z" fill={pedestalSolido} />
        <Path d="M301 158C301 229.797 234.119 287.5 151.001 287.5C67.8816 287.5 0.500488 228.797 0.500488 157C3.50049 171 66.5005 259.5 151.001 259C220.501 261.5 278 209 301 158Z" fill="url(#pedestalGrad)" />
        <Path d="M0.500488 157C3.50049 171 66.5005 259.5 151.001 259C220.501 261.5 278 209 301 158C301 3.49994 0.5 28.5001 0.500488 157Z" fill="url(#pedestalGrad)" />
        <Path d="M301 158C301 229.797 234.119 287.5 151.001 287.5C67.8816 287.5 0.500488 228.797 0.500488 157M301 158C278 209 220.501 261.5 151.001 259C66.5005 259.5 3.50049 171 0.500488 157M301 158C301 3.49994 0.5 28.5001 0.500488 157" fill="none" stroke="white" strokeOpacity={0.2} />
      </Svg>
      <AcentoBlur color={lineaBlur} tamano={tamano} />
      <Svg height={tamano} style={StyleSheet.absoluteFill} viewBox="0 0 302 303" width={tamano}>
        <Defs>
          <LinearGradient gradientUnits="userSpaceOnUse" id="botonTopeGrad" x1="151" x2="180.479" y1="0.5" y2="256.975">
            <Stop offset="0.59697" stopColor={pedestalClaro} />
            <Stop offset="1" stopColor={pedestalOscuro} />
          </LinearGradient>
          <LinearGradient gradientUnits="userSpaceOnUse" id="botonMedioGrad" x1="151" x2="173.154" y1="36.5" y2="234.69">
            <Stop offset="0.782899" stopColor={botonMedioClaro} />
            <Stop offset="1" stopColor={botonMedioOscuro} />
          </LinearGradient>
          <RadialGradient cx="50%" cy="50%" id="sombraPresionadoGrad" r="50%">
            <Stop offset="0%" stopColor="#0B5C30" stopOpacity={1} />
            <Stop offset="100%" stopColor="#66C27A" stopOpacity={0.35} />
          </RadialGradient>
        </Defs>
        <Ellipse cx={151} cy={130} fill="url(#botonTopeGrad)" rx={150.5} ry={129.5} stroke="white" strokeOpacity={0.2} />
        <Ellipse cx={151} cy={136.5} fill="url(#botonMedioGrad)" rx={119.5} ry={100} stroke={strokeEllipse} strokeWidth={2} />
        {/* Degradado radial EXACTO sobre botonMedioGrad — verde oscuro al
            centro, más suave en el borde — sube de opacidad al presionar
            (ver NodoSendero.tsx) en vez de un overlay negro plano. */}
        {oscurecimiento !== undefined && (
          <AnimatedEllipse cx={151} cy={136.5} fill="url(#sombraPresionadoGrad)" opacity={oscurecimiento} rx={119.5} ry={100} />
        )}
      </Svg>
    </>
  );
}

export function PedestalBotonSuperior({ color, tamano = 84 }: { color: string; tamano?: number }) {
  const [, , , , , botonTopeClaro, botonTopeOscuro] = rotarPaletaHex(PALETA_BASE, REFERENCIA_HUE, color);

  return (
    <Svg height={tamano} style={StyleSheet.absoluteFill} viewBox="0 0 302 303" width={tamano}>
      <Defs>
        <LinearGradient gradientUnits="userSpaceOnUse" id="botonSuperiorGrad" x1="151" x2="171.227" y1="23.5" y2="212.977">
          <Stop offset="0.59697" stopColor={botonTopeClaro} />
          <Stop offset="1" stopColor={botonTopeOscuro} />
        </LinearGradient>
      </Defs>
      {/* Más CHICA que botonMedioGrad (rx/ry -7.5) a propósito: al presionar
          (ver DESPLAZAMIENTO_PRESS en NodoSendero.tsx, calibrado para centrar
          ambas exactamente) esta elipse queda concéntrica y más pequeña que
          la oscura, dejando un borde parejo de la oscura visible alrededor —
          una encima de la otra, no tapándola por completo. */}
      <Ellipse cx={151} cy={119} fill="url(#botonSuperiorGrad)" rx={114} ry={94.5} stroke="white" strokeOpacity={0.2} />
    </Svg>
  );
}

// Bloqueado: paleta pálida del diseño Group 3(1).svg — antes fija sin
// importar el color del hábito; ahora, si se pasa `color`, se rota igual que
// la paleta desbloqueada (mismo rotarPaletaHex/REFERENCIA_HUE) para que un
// hábito azul (Diamante) también se vea pálido-azul bloqueado, no
// pálido-verde genérico. Sin `color`, se ve exactamente igual que antes.
const PALETA_BLOQUEADA = ['#EDFFED', '#CDFACC', '#C8E0B8', '#E2FFE2', '#C0EEBF', '#206116', '#ADF1B3', '#8AE280'] as const;

export function PedestalBaseBloqueada({ color, tamano = 84 }: { color?: string; tamano?: number }) {
  const [pedestalGradInicio, pedestalGradFin, solido, topeGradInicio, topeGradFin, acentoColor] = color
    ? rotarPaletaHex(PALETA_BLOQUEADA, REFERENCIA_HUE, color)
    : PALETA_BLOQUEADA;
  return (
    <>
      <Svg height={tamano} style={StyleSheet.absoluteFill} viewBox="0 0 302 303" width={tamano}>
        <Defs>
          <LinearGradient gradientUnits="userSpaceOnUse" id="pedestalBloqueadoGrad" x1="150.75" x2="175.385" y1="51.1851" y2="285.699">
            <Stop offset="0.59697" stopColor={pedestalGradInicio} />
            <Stop offset="1" stopColor={pedestalGradFin} />
          </LinearGradient>
        </Defs>
        <Path d="M301.5 157.5C301.5 229.297 234.119 287.5 151 287.5C67.8811 287.5 0.5 229.297 0.5 157.5C32 210.5 72 255.5 151 260.5C216 260.5 278.5 208.5 301.5 157.5Z" fill={solido} />
        <Path d="M301 158C301 229.797 234.119 287.5 151.001 287.5C67.8816 287.5 0.500488 228.797 0.500488 157C3.50049 171 66.5005 259.5 151.001 259C220.501 261.5 278 209 301 158Z" fill="url(#pedestalBloqueadoGrad)" />
        <Path d="M0.500488 157C3.50049 171 66.5005 259.5 151.001 259C220.501 261.5 278 209 301 158C301 3.50006 0.5 28.5002 0.500488 157Z" fill="url(#pedestalBloqueadoGrad)" />
        <Path d="M301 158C301 229.797 234.119 287.5 151.001 287.5C67.8816 287.5 0.500488 228.797 0.500488 157M301 158C278 209 220.501 261.5 151.001 259C66.5005 259.5 3.50049 171 0.500488 157M301 158C301 3.50006 0.5 28.5002 0.500488 157" fill="none" stroke="white" strokeOpacity={0.2} />
      </Svg>
      <AcentoBlur color={acentoColor} tamano={tamano} />
      <Svg height={tamano} style={StyleSheet.absoluteFill} viewBox="0 0 302 303" width={tamano}>
        <Defs>
          <LinearGradient gradientUnits="userSpaceOnUse" id="botonTopeBloqueadoGrad" x1="151" x2="180.479" y1="0.5" y2="256.975">
            <Stop offset="0.59697" stopColor={topeGradInicio} />
            <Stop offset="1" stopColor={topeGradFin} />
          </LinearGradient>
        </Defs>
        <Ellipse cx={151} cy={130} fill="url(#botonTopeBloqueadoGrad)" rx={150.5} ry={129.5} stroke="white" strokeOpacity={0.2} />
      </Svg>
    </>
  );
}

// Bloqueado no tiene una tercera elipse "superior" en el diseño original —
// solo pálida (fija, arriba) + esta (la única "de superficie"). Se queda como
// la pieza que anima al presionar, igual criterio que el estado normal.
export function PedestalBotonBloqueado({ color, tamano = 84 }: { color?: string; tamano?: number }) {
  const paleta = color ? rotarPaletaHex(PALETA_BLOQUEADA, REFERENCIA_HUE, color) : PALETA_BLOQUEADA;
  const [, , , , , , medioClaro, medioOscuro] = paleta;
  return (
    <Svg height={tamano} style={StyleSheet.absoluteFill} viewBox="0 0 302 303" width={tamano}>
      <Defs>
        <LinearGradient gradientUnits="userSpaceOnUse" id="botonMedioBloqueadoGrad" x1="151" x2="175.854" y1="26.5" y2="236.261">
          <Stop offset="0.59697" stopColor={medioClaro} />
          <Stop offset="1" stopColor={medioOscuro} />
        </LinearGradient>
      </Defs>
      <Ellipse cx={151} cy={132.5} fill="url(#botonMedioBloqueadoGrad)" rx={119.5} ry={106} stroke="white" strokeOpacity={0.2} strokeWidth={5} />
    </Svg>
  );
}
