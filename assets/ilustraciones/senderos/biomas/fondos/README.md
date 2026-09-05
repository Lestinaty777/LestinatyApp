# Fondos con patrón geométrico (SVG)

16 fondos: color sólido + textura geométrica en blanco transparente, listos para usar como
componentes SVG estáticos en tu app de Expo / React Native.

Cada archivo es un cuadrado de 300x300 que se puede escalar a cualquier tamaño sin perder
calidad (son vectores). El patrón está hecho con `<pattern>`, así que se repite en mosaico
sin cortes visibles en los bordes.

## Lista de archivos

| Archivo | Color | Patrón |
|---|---|---|
| 01_azul_diagonal.svg | Azul | Líneas diagonales |
| 02_naranja_puntos.svg | Naranja | Puntos |
| 03_verde_cruces.svg | Verde | Cruces finas |
| 04_morado_anillos.svg | Morado | Anillos |
| 05_rosa_zigzag.svg | Rosa | Zigzag vertical |
| 06_ambar_triangulos.svg | Ámbar | Triángulos |
| 07_azul_diagonal_invertida.svg | Azul | Diagonal invertida |
| 08_rosa_zigzag_horizontal.svg | Rosa | Zigzag horizontal |
| 09_azul_diagonales_dobles.svg | Azul | Diagonales en dos capas |
| 10_rosa_chevrones_apilados.svg | Rosa | Chevrones en dos capas |
| 11_azul_ondas.svg | Azul | Ondas suaves |
| 12_rosa_cruz_lineas.svg | Rosa (vino) | Cuadrícula de líneas |
| 13_rosa_puntos_diagonales.svg | Rosa | Puntos en diagonal |
| 14_azul_espiga.svg | Azul | Espiga corta |
| 15_rosa_circulos_concentricos.svg | Rosa | Círculos concéntricos |
| 16_azul_rombos.svg | Azul | Rombos |

## Uso en Expo / React Native

Instala la librería si no la tienes:

```bash
npx expo install react-native-svg
```

Convierte los SVG a componentes con `react-native-svg-transformer` (recomendado para
importarlos como si fueran componentes de React), o cárgalos directamente con
`react-native-svg` usando `SvgXml` / `SvgUri`.

### Opción A — como componente (react-native-svg-transformer)

```bash
npx expo install react-native-svg-transformer
```

Configura `metro.config.js` según la documentación de la librería, y luego:

```jsx
import Fondo01 from './assets/svg_patterns/01_azul_diagonal.svg';

<Fondo01 width="100%" height="100%" />
```

### Opción B — con SvgXml (sin configurar metro)

```jsx
import { SvgXml } from 'react-native-svg';
import { useEffect, useState } from 'react';
import { Asset } from 'expo-asset';

const xml = require('./assets/svg_patterns/01_azul_diagonal.svg');
// Si usas require con .svg como texto, cárgalo con fetch/Asset y pásalo a SvgXml.
```
Lo más simple: copia el contenido del archivo .svg como string en tu código y pásalo a
`<SvgXml xml={svgString} width="100%" height="100%" />`.

## Sobre la animación

Estos archivos están guardados como SVG **estático** a propósito: el movimiento que viste
en el chat usa `<animateTransform>` (animación SMIL), que los navegadores soportan pero
`react-native-svg` **no** interpreta.

Para animarlos dentro de tu app Expo, la forma que sí funciona es controlar el
`patternTransform` del `<Pattern>` con `Animated` o `react-native-reanimated`. Ejemplo con
el patrón diagonal (equivalente a 01_azul_diagonal.svg):

```jsx
import { useEffect, useRef } from 'react';
import { Animated, Easing } from 'react-native';
import Svg, { Defs, Pattern, Path, Rect } from 'react-native-svg';

const AnimatedPattern = Animated.createAnimatedComponent(Pattern);

export default function FondoAnimado() {
  const offset = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.timing(offset, {
        toValue: 40,
        duration: 15000,
        easing: Easing.linear,
        useNativeDriver: false, // patternTransform no soporta native driver
      })
    ).start();
  }, []);

  const patternTransform = offset.interpolate({
    inputRange: [0, 40],
    outputRange: ['translate(0,0)', 'translate(40,40)'],
  });

  return (
    <Svg width="100%" height="100%" viewBox="0 0 300 300">
      <Defs>
        <AnimatedPattern
          id="pat1"
          width={40}
          height={40}
          patternUnits="userSpaceOnUse"
          patternTransform={patternTransform}
        >
          <Path d="M0,40 L40,0" stroke="#ffffff" strokeWidth={2.4} opacity={0.75} />
        </AnimatedPattern>
      </Defs>
      <Rect x={0} y={0} width={300} height={300} fill="#1D78D1" />
      <Rect x={0} y={0} width={300} height={300} fill="url(#pat1)" />
    </Svg>
  );
}
```

Puedes repetir este patrón (usando `useNativeDriver: false` siempre, porque `patternTransform`
no es una propiedad nativa animable) para cualquiera de los 16 diseños, ajustando el `d` del
`Path`/`Circle` según el archivo que quieras animar.
