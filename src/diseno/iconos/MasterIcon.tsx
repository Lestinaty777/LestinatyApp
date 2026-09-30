import { Image, type StyleProp, type ViewStyle } from 'react-native';
import { MasterChanger, type ColorMaster } from '../componentes/MasterChanger';
import { Skeleton } from '../componentes/Skeleton';
import { useTonoMaster } from '../tema/MasterColorContext';
import { buscarIcono } from './registroIconos';
import { rutaDeIcono } from './rutaIcono';

export type { ColorMaster } from '../componentes/MasterChanger';

type MasterIconProps = {
  /** Id del ícono en el registro global (ver registroIconos.ts). */
  name: string;
  /** 1=Azul, 2=Verde, 3=Amarillo, 4=Naranja, 5=Rojo, 6=Rosa, 7=Morado. Sin esto, se muestra tal cual. */
  color?: ColorMaster;
  /**
   * Hue destino en grados (0-360): tiñe el icono a ese hue exacto (p. ej. `tono.hueIcono`).
   * Sin `color` ni `hueDestino`, dentro de un MasterColorProvider el icono sigue
   * el tema: rota relativo a su propio hue y solo si es verde (ver MasterChanger).
   */
  hueDestino?: number;
  /**
   * "Tiñe este icono con el color de la marca": el verde de siempre en Esmeralda
   * (idéntico a `color={2}`) y, con otro tono, el matiz exacto de ese paquete.
   * Sirve para recolorear un icono que NO es verde (racha, insignias...) para
   * que combine con el resto; los iconos que ya son verdes siguen el tema solos.
   */
  alTema?: boolean;
  /** Oscurece el icono después de aplicar el color (1 = sin cambio). */
  oscurecido?: number;
  size?: number;
  /** Si está activo, renderiza un Skeleton pulsante de su mismo tamaño en lugar del ícono. */
  cargando?: boolean;
  loading?: boolean;
  radioSkeleton?: number;
  style?: StyleProp<ViewStyle>;
};

// Ícono de imagen (no SVG) que se usa como lucide-react-native: <MasterIcon
// name="agua" color={2} size={28} />. Por dentro es MasterChanger — detecta el
// hue del PNG solo y lo rota al color pedido, sin que tengas que medir nada.
// Dentro de un MasterColorProvider los iconos verdes siguen el tema (rotación
// relativa de hue + saturación/oscurecido del tono); sin Provider se comporta como siempre.
// Si está cargando o no se encuentra el ícono en /UI, muestra un Skeleton pulsante.
export function MasterIcon({ name, color, hueDestino, alTema, oscurecido, size = 24, cargando, loading, radioSkeleton, style }: MasterIconProps) {
  const tono = useTonoMaster();
  if (cargando || loading) {
    return <Skeleton alto={size} ancho={size} radio={radioSkeleton ?? Math.round(size * 0.28)} style={style} />;
  }
  const icono = buscarIcono(name);
  if (!icono) {
    if (__DEV__) console.warn(`MasterIcon: "${name}" no está en el registro de iconos (registroIconos.ts).`);
    return <Skeleton alto={size} ancho={size} radio={radioSkeleton ?? Math.round(size * 0.28)} style={style} />;
  }
  // `alTema` es un teñido forzado al matiz del tono activo; en Esmeralda (sin matiz) cae al verde 2 de siempre.
  const hueForzado = hueDestino ?? (alTema ? tono.hueIcono : undefined);
  const colorForzado = color ?? (alTema && tono.hueIcono === undefined ? 2 : undefined);
  // Ruta rápida: un <Image> normal (síncrono, sin Skia) salvo que de verdad haya que rotar el matiz.
  // El hue del PNG viene medido en el registro, así que no se decodifica nada para decidir.
  if (rutaDeIcono({ color: colorForzado, deltaHue: tono.deltaHueIcono, hue: icono.hue, hueDestino: hueForzado, oscurecido }) === 'imagen') {
    return <Image resizeMode="contain" source={icono.fuente} style={{ height: size, width: size }} />;
  }
  // Un `color` explícito sin hueDestino es un teñido forzado de la API vieja: no lo mezclamos con el tono.
  const usaTono = colorForzado === undefined || hueForzado !== undefined;
  return <MasterChanger ancho={size} alto={size} colorDestino={colorForzado} deltaTema={colorForzado === undefined && hueForzado === undefined ? tono.deltaHueIcono : undefined} fuente={icono.fuente} hueDestino={hueForzado} hueOrigen={icono.hue} oscurecido={oscurecido} saturacion={usaTono ? tono.icono.saturacion : 1} valorTema={usaTono ? tono.icono.valor : 1} />;
}
