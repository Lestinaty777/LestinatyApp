import { BlurMask, Canvas, Group, Path as PathSkia } from '@shopify/react-native-skia';
import { StyleSheet } from 'react-native';
import { Defs, Ellipse, LinearGradient, Path, Stop, Svg } from 'react-native-svg';

import { rotarPaletaHex } from '../../algoritmo/colorHsl';

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

export function PedestalBase({ color, tamano = 84 }: { color: string; tamano?: number }) {
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
        </Defs>
        <Ellipse cx={151} cy={130} fill="url(#botonTopeGrad)" rx={150.5} ry={129.5} stroke="white" strokeOpacity={0.2} />
        <Ellipse cx={151} cy={136.5} fill="url(#botonMedioGrad)" rx={119.5} ry={100} stroke={strokeEllipse} strokeWidth={2} />
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
      {/* Ligeramente MÁS GRANDE que botonMedioGrad (rx/ry +1.5) a propósito:
          así al presionar (ver DESPLAZAMIENTO_PRESS en NodoSendero.tsx) esta
          elipse cae sobre la oscura y la rebasa por un pelito en todo el
          borde — garantiza que nunca quede una rendija visible, con un
          bultito mínimo "premium" en vez de quedar exactamente del mismo
          tamaño. Si cambias el tamaño de botonMedioGrad, mantén este +1.5. */}
      <Ellipse cx={151} cy={119} fill="url(#botonSuperiorGrad)" rx={121} ry={101.5} stroke="white" strokeOpacity={0.2} />
    </Svg>
  );
}

// Bloqueado: paleta fija (pálida) del diseño Group 3(1).svg, sin rotar por
// color — un nodo bloqueado siempre se ve igual sin importar en qué color
// terminará una vez desbloqueado. También sin el candado fijo del original
// (el ícono dinámico real ya lo resuelve HabitosPantalla/mapaEjercicio).
export function PedestalBaseBloqueada({ tamano = 84 }: { tamano?: number }) {
  return (
    <>
      <Svg height={tamano} style={StyleSheet.absoluteFill} viewBox="0 0 302 303" width={tamano}>
        <Defs>
          <LinearGradient gradientUnits="userSpaceOnUse" id="pedestalBloqueadoGrad" x1="150.75" x2="175.385" y1="51.1851" y2="285.699">
            <Stop offset="0.59697" stopColor="#EDFFED" />
            <Stop offset="1" stopColor="#CDFACC" />
          </LinearGradient>
        </Defs>
        <Path d="M301.5 157.5C301.5 229.297 234.119 287.5 151 287.5C67.8811 287.5 0.5 229.297 0.5 157.5C32 210.5 72 255.5 151 260.5C216 260.5 278.5 208.5 301.5 157.5Z" fill="#C8E0B8" />
        <Path d="M301 158C301 229.797 234.119 287.5 151.001 287.5C67.8816 287.5 0.500488 228.797 0.500488 157C3.50049 171 66.5005 259.5 151.001 259C220.501 261.5 278 209 301 158Z" fill="url(#pedestalBloqueadoGrad)" />
        <Path d="M0.500488 157C3.50049 171 66.5005 259.5 151.001 259C220.501 261.5 278 209 301 158C301 3.50006 0.5 28.5002 0.500488 157Z" fill="url(#pedestalBloqueadoGrad)" />
        <Path d="M301 158C301 229.797 234.119 287.5 151.001 287.5C67.8816 287.5 0.500488 228.797 0.500488 157M301 158C278 209 220.501 261.5 151.001 259C66.5005 259.5 3.50049 171 0.500488 157M301 158C301 3.50006 0.5 28.5002 0.500488 157" fill="none" stroke="white" strokeOpacity={0.2} />
      </Svg>
      <AcentoBlur color="#206116" tamano={tamano} />
      <Svg height={tamano} style={StyleSheet.absoluteFill} viewBox="0 0 302 303" width={tamano}>
        <Defs>
          <LinearGradient gradientUnits="userSpaceOnUse" id="botonTopeBloqueadoGrad" x1="151" x2="180.479" y1="0.5" y2="256.975">
            <Stop offset="0.59697" stopColor="#E2FFE2" />
            <Stop offset="1" stopColor="#C0EEBF" />
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
export function PedestalBotonBloqueado({ tamano = 84 }: { tamano?: number }) {
  return (
    <Svg height={tamano} style={StyleSheet.absoluteFill} viewBox="0 0 302 303" width={tamano}>
      <Defs>
        <LinearGradient gradientUnits="userSpaceOnUse" id="botonMedioBloqueadoGrad" x1="151" x2="175.854" y1="26.5" y2="236.261">
          <Stop offset="0.59697" stopColor="#ADF1B3" />
          <Stop offset="1" stopColor="#8AE280" />
        </LinearGradient>
      </Defs>
      <Ellipse cx={151} cy={132.5} fill="url(#botonMedioBloqueadoGrad)" rx={119.5} ry={106} stroke="white" strokeOpacity={0.2} strokeWidth={5} />
    </Svg>
  );
}
