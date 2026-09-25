import type { ImageSourcePropType, StyleProp, ViewStyle } from 'react-native';
import type { ReactNode } from 'react';
import { Image, StyleSheet, View } from 'react-native';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';

import { MasterGlass } from './MasterGlass';
import { MasterChanger } from '../componentes/MasterChanger';
import { Skeleton } from '../componentes/Skeleton';
import { rutaDeIcono } from '../iconos/rutaIcono';
import { useTonoMaster } from '../tema/MasterColorContext';
import { useEscala } from '../tema/MasterColorContext';
import type { EscalaMaster } from '../tema/escalaEsmeralda';

type MasterIconBgProps = {
  children?: ReactNode;
  colorBordeFin?: string;
  colorBordeInicio?: string;
  degradadoFin?: string;
  degradadoInicio?: string;
  fuente?: ImageSourcePropType;
  /** Hue medido del PNG (viene del registro de iconos): evita decodificarlo para saber si el tema lo afecta. */
  hue?: number;
  size?: number;
  style?: StyleProp<ViewStyle>;
  /**
   * Tiñe el fondo interior (el "glass" menta de MasterGlass, que es fijo y
   * no acepta un color propio) hacia este tono — sin esto, el fondo siempre
   * queda verde sin importar el borde/degradado de arriba.
   */
  tinte?: string;
  cargando?: boolean;
  loading?: boolean;
};

// Fondo de icono glass con anillo degradado verde — extraído tal cual de la
// tarjeta de hábito de "Hoy" (TarjetaSenderoHabito) para reusarse en
// cualquier lugar del diseño que necesite ese mismo marco. Acepta una imagen
// (fuente) o cualquier otro contenido (children, p. ej. un icono de lucide).
export function MasterIconBg({
  children, colorBordeFin, colorBordeInicio,
  degradadoFin, degradadoInicio,
  fuente, hue, size = 68, style, tinte, cargando, loading,
}: MasterIconBgProps) {
  const mib = useEstilosMib();
  const tono = useTonoMaster();
  // Sin colores explícitos toma los del tono activo (Esmeralda = los verdes de siempre).
  const bordeFin = colorBordeFin ?? tono.marcoIcono.bordeFin;
  const bordeInicio = colorBordeInicio ?? tono.marcoIcono.bordeInicio;
  const radioExterior = Math.round(size * (18 / 68));
  const radioInterior = Math.round(size * (16 / 68));
  const tamanoIcono = Math.round(size * (48 / 68) * 1.2);

  if (cargando || loading) {
    return <Skeleton alto={size} ancho={size} radio={radioExterior} style={style} />;
  }

  return (
    // Misma separación que en MasterGlass: la sombra vive en este wrapper
    // transparente de afuera, cuyo único hijo es el marco real — un solo
    // hijo del mismo tamaño y radio le da a iOS una forma inequívoca para
    // redondear el shadowPath. Antes la sombra estaba en el propio `marco`,
    // que al no tener backgroundColor (el SVG y el MasterGlass son hijos
    // superpuestos, no un fondo sólido) hacía que iOS cayera al rectángulo
    // completo del layer en vez de la esquina redondeada.
    <View style={[mib.sombra, { alignSelf: 'flex-start', borderRadius: radioExterior, height: size, width: size }, style]}>
      <View style={[mib.marco, { borderRadius: radioExterior, height: size, width: size }]}>
        <Svg height={size} pointerEvents="none" style={mib.borde} width={size}>
          <Defs>
            <LinearGradient id="masterIconBgBorde" x1="0%" x2="100%" y1="0%" y2="100%">
              <Stop offset="0" stopColor={bordeInicio} />
              <Stop offset="1" stopColor={bordeFin} />
            </LinearGradient>
          </Defs>
          <Rect fill="url(#masterIconBgBorde)" height={size} rx={radioExterior} ry={radioExterior} width={size} />
        </Svg>
        <MasterGlass blur compacto style={[mib.glass, { borderRadius: radioInterior }]}>
          {/* MasterGlass es fijo verde menta y no tiene prop de color propio —
              esta capa lo tiñe hacia `tinte` sin tocar ese componente
              compartido (lo usan muchas otras pantallas que deben seguir
              viéndose verdes). Sin `tinte`, se comporta igual que antes. */}
          {tinte && <View pointerEvents="none" style={[StyleSheet.absoluteFill, { backgroundColor: tinte, borderRadius: radioInterior, opacity: 0.4 }]} />}
          {fuente ? (rutaDeIcono({ deltaHue: tono.deltaHue, hue }) === 'imagen'
            ? <Image resizeMode="contain" source={fuente} style={{ height: tamanoIcono, width: tamanoIcono }} />
            : <MasterChanger alto={tamanoIcono} ancho={tamanoIcono} deltaTema={tono.deltaHue} fuente={fuente} hueOrigen={hue} saturacion={tono.icono.saturacion} valorTema={tono.icono.valor} />) : children}
        </MasterGlass>
      </View>
    </View>
  );
}

const crearEstilosMib = (esc: EscalaMaster) => StyleSheet.create({
  sombra: { shadowColor: esc.jade.l38, shadowOffset: { height: 4, width: 3 }, shadowOpacity: 0.16, shadowRadius: 7 },
  marco: { elevation: 3, padding: 2, position: 'relative' },
  borde: { left: 0, position: 'absolute', top: 0 },
  glass: { alignItems: 'center', flex: 1, justifyContent: 'center' },
});

const estilosPorEscalaMib = new WeakMap<EscalaMaster, ReturnType<typeof crearEstilosMib>>();

function useEstilosMib() {
  const esc = useEscala();
  let valor = estilosPorEscalaMib.get(esc);
  if (!valor) {
    valor = crearEstilosMib(esc);
    estilosPorEscalaMib.set(esc, valor);
  }
  return valor;
}
