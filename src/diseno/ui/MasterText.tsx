import React, { ComponentType, useId, useMemo, useState } from 'react';
import {
  LayoutChangeEvent,
  StyleProp,
  StyleSheet,
  Text as RNText,
  TextProps as RNTextProps,
  TextStyle,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, {
  Defs,
  LinearGradient as SvgLinearGradient,
  Mask,
  Rect,
  Stop,
} from 'react-native-svg';

import { tipografia } from '../fundamentos/tipografia';
import { useTonoMaster } from '../tema/MasterColorContext';
import { obtenerColoresUI } from '../tema/ui';
import { ESCALA_ESMERALDA } from '../tema/escalaEsmeralda';

// Cargar MaskedView nativo si está disponible
let MaskedViewComponent: ComponentType<any> | null = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const mv = require('@react-native-masked-view/masked-view');
  MaskedViewComponent = mv.default || mv;
} catch {
  MaskedViewComponent = null;
}

// Degradado verde por defecto del sistema Master (idéntico a la identidad de la app)
export const DEGRADADO_VERDE_MASTER = [ESCALA_ESMERALDA.hoja.l82, ESCALA_ESMERALDA.jade.l56, ESCALA_ESMERALDA.jade.l40] as const;
export const COLOR_VERDE_FALLBACK = ESCALA_ESMERALDA.jade.l49;

export type VarianteMasterText = 'titulo' | 'subtitulo' | 'cuerpo' | 'ayuda';

export interface PalabraGradienteConfig {
  /** Palabra o frase exacta a resaltar con degradado */
  palabra: string;
  /** Colores del degradado [inicio, fin, ...] (por defecto el verde Master) */
  colores?: readonly [string, string, ...string[]];
  /** Color sólido en caso de fallo o fallback (por defecto el verde sólido de marca) */
  colorSolido?: string;
  /** Coordenada de inicio {x, y} de 0 a 1 */
  start?: { x: number; y: number };
  /** Coordenada de fin {x, y} de 0 a 1 */
  end?: { x: number; y: number };
}

export interface MasterTextProps extends RNTextProps {
  /** Texto completo (string). */
  children: string;
  /**
   * Palabras o frases que deben tener degradado.
   * Puede ser:
   * - Un array de strings: `['jardín', 'crecer']` (usa el degradado verde por defecto).
   * - Un string único: `'jardín'`
   * - Un array de objetos con configuración personalizada: `[{ palabra: 'jardín', colores: ['#34D399', '#059669'] }]`
   * - Booleano `true` para aplicarlo a todo el texto.
   */
  gradiente?:
    | string
    | readonly string[]
    | readonly PalabraGradienteConfig[]
    | boolean;
  /** Colores del degradado global si `gradiente={true}` o para las palabras string pasadas */
  coloresGradiente?: readonly [string, string, ...string[]];
  /** Color sólido de fallback para los fragmentos con degradado */
  colorFallback?: string;
  /** Variante tipográfica (estándar con Texto de Master) */
  variante?: VarianteMasterText;
  /** Coordenadas opcionales del degradado */
  start?: { x: number; y: number };
  end?: { x: number; y: number };
}

/**
 * Componente que renderiza un fragmento con degradado utilizando la estrategia más
 * confiable en React Native:
 * 1) `@react-native-masked-view/masked-view` + `expo-linear-gradient` (método nativo estándar, soporta cualquier fuente y estilo).
 * 2) Svg Mask (luminance / alpha) como fallback dinámico con auto-medición.
 * 3) Color sólido de marca de respaldo inmediato.
 */
function FragmentoTextoGradiente({
  children,
  colores = DEGRADADO_VERDE_MASTER,
  colorSolido = COLOR_VERDE_FALLBACK,
  start = { x: 0, y: 0 },
  end = { x: 1, y: 0 },
  style,
}: {
  children: string;
  colores?: readonly [string, string, ...string[]];
  colorSolido?: string;
  start?: { x: number; y: number };
  end?: { x: number; y: number };
  style?: StyleProp<TextStyle>;
}) {
  const [tamano, setTamano] = useState<{ ancho: number; alto: number }>({
    ancho: 0,
    alto: 0,
  });

  const rawId = useId();
  const maskId = useMemo(
    () => `mt_mask_${rawId.replace(/[^a-zA-Z0-9]/g, '_')}`,
    [rawId]
  );
  const gradienteId = useMemo(
    () => `mt_grad_${rawId.replace(/[^a-zA-Z0-9]/g, '_')}`,
    [rawId]
  );

  const alMedir = (e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    if (
      Math.abs(width - tamano.ancho) > 0.5 ||
      Math.abs(height - tamano.alto) > 0.5
    ) {
      setTamano({ ancho: Math.ceil(width), alto: Math.ceil(height) });
    }
  };

  // ESTRATEGIA 1: Si MaskedView nativo está presente en el runtime
  if (MaskedViewComponent) {
    const MV = MaskedViewComponent;
    return (
      <MV
        maskElement={
          <RNText style={[style, { backgroundColor: 'transparent' }]}>
            {children}
          </RNText>
        }
      >
        <LinearGradient
          colors={colores as unknown as readonly [string, string, ...string[]]}
          end={end}
          start={start}
        >
          {/* Texto invisible con la misma tipografía y tamaño para darle las dimensiones exactas al gradiente */}
          <RNText style={[style, { opacity: 0 }]}>
            {children}
          </RNText>
        </LinearGradient>
      </MV>
    );
  }

  // ESTRATEGIA 2: Svg Mask con auto-medición
  const listo = tamano.ancho > 0 && tamano.alto > 0;

  return (
    <View style={s.contenedorFragmento}>
      {/* Texto base visible como fallback si no está medido */}
      <RNText
        onLayout={alMedir}
        style={[
          style,
          listo ? s.textoTransparente : { color: colorSolido },
        ]}
      >
        {children}
      </RNText>

      {listo && (
        <View pointerEvents="none" style={StyleSheet.absoluteFill}>
          <Svg height={tamano.alto} width={tamano.ancho}>
            <Defs>
              <SvgLinearGradient
                id={gradienteId}
                x1={`${start.x * 100}%`}
                x2={`${end.x * 100}%`}
                y1={`${start.y * 100}%`}
                y2={`${end.y * 100}%`}
              >
                {colores.map((color, idx) => (
                  <Stop
                    key={idx}
                    offset={`${(idx / (colores.length - 1)) * 100}%`}
                    stopColor={color}
                  />
                ))}
              </SvgLinearGradient>

              <Mask
                height={tamano.alto}
                id={maskId}
                maskContentUnits="userSpaceOnUse"
                maskUnits="userSpaceOnUse"
                width={tamano.ancho}
                x="0"
                y="0"
              >
                <RNText style={[style, s.textoBlancoMascara]}>
                  {children}
                </RNText>
              </Mask>
            </Defs>

            <Rect
              fill={`url(#${gradienteId})`}
              height={tamano.alto}
              mask={`url(#${maskId})`}
              width={tamano.ancho}
              x="0"
              y="0"
            />
          </Svg>
        </View>
      )}
    </View>
  );
}

/**
 * Normaliza las palabras objetivo a una lista ordenada de configuraciones
 */
function normalizarObjetivos(
  gradiente: MasterTextProps['gradiente'],
  coloresPorDefecto: readonly [string, string, ...string[]],
  colorFallbackPorDefecto: string,
  startDefecto: { x: number; y: number },
  endDefecto: { x: number; y: number }
): PalabraGradienteConfig[] {
  if (!gradiente) return [];

  if (typeof gradiente === 'string') {
    return [
      {
        palabra: gradiente,
        colores: coloresPorDefecto,
        colorSolido: colorFallbackPorDefecto,
        start: startDefecto,
        end: endDefecto,
      },
    ];
  }

  if (Array.isArray(gradiente)) {
    return gradiente.map((item) => {
      if (typeof item === 'string') {
        return {
          palabra: item,
          colores: coloresPorDefecto,
          colorSolido: colorFallbackPorDefecto,
          start: startDefecto,
          end: endDefecto,
        };
      }
      return {
        palabra: item.palabra,
        colores: item.colores || coloresPorDefecto,
        colorSolido: item.colorSolido || colorFallbackPorDefecto,
        start: item.start || startDefecto,
        end: item.end || endDefecto,
      };
    });
  }

  return [];
}

/**
 * MasterText: Componente tipográfico de diseño Master que permite aplicar
 * gradientes a palabras específicas o a todo el texto, con soporte multi-motor
 * (MaskedView nativo / Svg Mask) y fallback de color sólido garantizado.
 */
export function MasterText({
  children,
  gradiente,
  coloresGradiente: coloresGradienteProp,
  colorFallback: colorFallbackProp,
  variante = 'cuerpo',
  start = { x: 0, y: 0 },
  end = { x: 1, y: 0 },
  style,
  ...resto
}: MasterTextProps) {
  const coloresUI = obtenerColoresUI();
  // Sin colores explícitos toma los del tono activo (Esmeralda = DEGRADADO_VERDE_MASTER / COLOR_VERDE_FALLBACK).
  const { degradados: g } = useTonoMaster();
  const coloresGradiente = coloresGradienteProp ?? g.texto;
  const colorFallback = colorFallbackProp ?? g.textoSolido;

  const estiloBase = [
    s.base,
    s[variante],
    { color: variante === 'ayuda' ? coloresUI.textoSecundario : coloresUI.texto },
    style,
  ];

  if (typeof children !== 'string' || !gradiente) {
    return (
      <RNText {...resto} style={estiloBase}>
        {children}
      </RNText>
    );
  }

  // Todo el texto lleva degradado
  if (gradiente === true) {
    return (
      <FragmentoTextoGradiente
        colores={coloresGradiente}
        colorSolido={colorFallback}
        end={end}
        start={start}
        style={estiloBase}
      >
        {children}
      </FragmentoTextoGradiente>
    );
  }

  const objetivos = normalizarObjetivos(
    gradiente,
    coloresGradiente,
    colorFallback,
    start,
    end
  );

  if (objetivos.length === 0) {
    return (
      <RNText {...resto} style={estiloBase}>
        {children}
      </RNText>
    );
  }

  const patrones = [...objetivos]
    .filter((o) => o.palabra && o.palabra.trim().length > 0)
    .sort((a, b) => b.palabra.length - a.palabra.length);

  if (patrones.length === 0) {
    return (
      <RNText {...resto} style={estiloBase}>
        {children}
      </RNText>
    );
  }

  const regexEscape = (str: string) =>
    str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(
    `(${patrones.map((p) => regexEscape(p.palabra)).join('|')})`,
    'g'
  );

  const partes = children.split(regex);

  return (
    <RNText {...resto} style={estiloBase}>
      {partes.map((parte, index) => {
        const configCoincidente = patrones.find(
          (p) => p.palabra.toLowerCase() === parte.toLowerCase()
        );

        if (configCoincidente) {
          return (
            <FragmentoTextoGradiente
              colores={configCoincidente.colores}
              colorSolido={configCoincidente.colorSolido}
              end={configCoincidente.end}
              key={`grad_${index}_${parte}`}
              start={configCoincidente.start}
              style={estiloBase}
            >
              {parte}
            </FragmentoTextoGradiente>
          );
        }

        return parte;
      })}
    </RNText>
  );
}

const s = StyleSheet.create({
  base: {
    fontFamily: 'MontserratAlternates-Medium',
  },
  titulo: {
    fontSize: tipografia.titulo,
    fontFamily: 'Montserrat-Bold',
    lineHeight: 38,
  },
  subtitulo: {
    fontSize: tipografia.subtitulo,
    fontFamily: 'MontserratAlternates-Bold',
    lineHeight: 28,
  },
  cuerpo: {
    fontSize: tipografia.cuerpo,
    lineHeight: 23,
  },
  ayuda: {
    fontFamily: 'MontserratAlternates-Medium',
    fontSize: tipografia.ayuda,
    lineHeight: 20,
  },
  contenedorFragmento: {
    position: 'relative',
  },
  textoTransparente: {
    opacity: 0,
  },
  textoBlancoMascara: {
    color: '#FFFFFF',
  },
});
