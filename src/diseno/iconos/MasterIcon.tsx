import type { StyleProp, ViewStyle } from 'react-native';
import { MasterChanger, type ColorMaster } from '../componentes/MasterChanger';
import { Skeleton } from '../componentes/Skeleton';
import { useTonoMaster } from '../tema/MasterColorContext';
import { buscarIcono } from './registroIconos';

export type { ColorMaster } from '../componentes/MasterChanger';

type MasterIconProps = {
  /** Id del ícono en el registro global (ver registroIconos.ts). */
  name: string;
  /** 1=Azul, 2=Verde, 3=Amarillo, 4=Naranja, 5=Rojo, 6=Rosa, 7=Morado. Sin esto, se muestra tal cual. */
  color?: ColorMaster;
  /**
   * Hue destino en grados (0-360). Sin esto, dentro de un MasterColorProvider
   * el icono toma el hue del tono activo — y ese tono manda sobre `color`.
   */
  hueDestino?: number;
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
// Dentro de un MasterColorProvider toma el tono del paquete activo (hue,
// saturación y oscurecido); sin Provider se comporta como siempre.
// Si está cargando o no se encuentra el ícono en /UI, muestra un Skeleton pulsante.
export function MasterIcon({ name, color, hueDestino, oscurecido, size = 24, cargando, loading, radioSkeleton, style }: MasterIconProps) {
  const tono = useTonoMaster();
  if (cargando || loading) {
    return <Skeleton alto={size} ancho={size} radio={radioSkeleton ?? Math.round(size * 0.28)} style={style} />;
  }
  const icono = buscarIcono(name);
  if (!icono) {
    return <Skeleton alto={size} ancho={size} radio={radioSkeleton ?? Math.round(size * 0.28)} style={style} />;
  }
  return <MasterChanger ancho={size} alto={size} colorDestino={color} fuente={icono.fuente} hueDestino={hueDestino ?? tono.hue} oscurecido={(oscurecido ?? 1) * tono.oscurecido} saturacion={tono.saturacion} />;
}
