import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Image, type ImageSourcePropType, ScrollView, StyleSheet, useWindowDimensions, View, Pressable, TouchableWithoutFeedback } from 'react-native';
import { useRouter } from 'expo-router';
import Svg, { Path } from 'react-native-svg';
import { BlurMask, Canvas, Group, Oval, Path as PathSkia } from '@shopify/react-native-skia';

import { MasterGlass, MasterButton, Texto } from '../../../../diseno';
import { colorMasterMasCercano, MasterChanger, type ColorMaster } from '../../../../diseno/componentes/MasterChanger';
import { crearTemaMapa, generarMapaProcedural, type CategoriaMapaId, type MapaProcedural } from '../../algoritmo/mapaProcedural';
import { ASSETS_AMBIENTE_UNIVERSAL, obtenerAssetBioma, obtenerAssetEtapaUnoPaquete, obtenerAssetSemillaPaquete, registroBiomas, tienePaqueteAssetsReales } from '../../algoritmo/registroBiomas';
import { obtenerNodosMapaMock } from '../../datos/mapaEjercicio.mock';
import type { EstadoNodoMapa, NodoMapaSendero } from '../../datos/mapaEjercicio.mock';
import type { TipoMetaHabito } from '../../../habitos/tipos';
import { PixelartIcon } from '../../../../diseno/iconos/PixelartIcon';
import { LamparaSendero } from './LamparaSendero';
import { LinearGradient } from 'expo-linear-gradient';
import { rotarPaletaHex } from '../../algoritmo/colorHsl';
import { resolverPaqueteHabito } from '../../../habitos/paqueteHabito';
import { useTranslation } from 'react-i18next';

import { NodoSendero } from './NodoSendero';

type ContenedorMapaSenderosProps = {
  altura: number;
  categoriaId: CategoriaMapaId;
  color: string;
  enfocado: boolean;
  /** Meta/tipo del hábito real detrás de este mapa — solo para armar la descripción genérica del tooltip (categoriaId 'habitos'). Sin esto, el tooltip usa un texto genérico de "lección". */
  infoHabito?: { meta: number; tipoMeta: TipoMetaHabito; unidad: string | null };
  /** Nodos reales a mostrar (por ejemplo, los días hacia el próximo nivel de un hábito). Si se omite, se usan los nodos mock por subcategoriaId. */
  nodos?: NodoMapaSendero[];
  /** Si se pasa, reemplaza la navegación mock de "Comenzar" del tooltip — para contextos con una acción real (ej. registrar progreso de un hábito). */
  onCompletarNodo?: (nodo: NodoMapaSendero, indice: number) => void;
  subcategoriaId: string;
  /** Nivel real 1-7 del hábito — solo aplica a categoriaId 'habitos', define qué etapas de crecimiento se mezclan. */
  nivel?: number;
  /** Paquete de árbol asignado al hábito (fijo de por vida) — solo aplica a categoriaId 'habitos'. */
  paqueteId?: string;
  /** 0-1: qué tan crecido está el pasto en niveles 1-3 — solo aplica a categoriaId 'habitos'. */
  progresoPastoTemprano?: number;
  /** Desplaza el primer nodo para vistas compactas, sin alterar los mapas estándar. */
  desplazamientoSuperior?: number;
};

const separacionVertical = 112;
// Debe reflejar el arranque compacto que usa generarMapaProcedural; así el
// primer nodo entra cerca al cambiar de nivel, sin efecto de alejamiento.
const margenSuperior = 222;
const margenInferior = 64;
const AnimatedPath = Animated.createAnimatedComponent(Path);
const zIndexPorCapa = { fondo: 1, medio: 3, frente: 4 } as const;

// Sombra de contacto muy sutil bajo cada elemento del terreno,
// para que no floten sobre el suelo — verde oscuro, difuminada de verdad con
// Skia (igual que AcentoBlur en PedestalNodo.tsx: una <View> con opacity no
// se difumina, hace falta BlurMask sobre un <Canvas>).
function SombraSuelo({ tamano, vegetacion = false }: { tamano: number; vegetacion?: boolean }) {
  // Las copas llevan mucho aire transparente dentro del PNG. Para árboles,
  // flores y arbustos la sombra se calcula desde su tamaño final, pero con
  // una huella de base más compacta que la de una roca o macizo de pasto.
  const ancho = Math.max(vegetacion ? 14 : 12, tamano * (vegetacion ? 0.5 : 0.44));
  const alto = Math.max(vegetacion ? 3 : 2.5, tamano * (vegetacion ? 0.085 : 0.1));
  const desenfoque = Math.max(1.5, tamano * (vegetacion ? 0.045 : 0.05));
  const x = (tamano - ancho) / 2;
  // Pegada a la base real del sprite (no al borde del cuadro contenedor, que
  // suele tener aire arriba/abajo por el "contain") y detrás de la imagen —
  // este Canvas se declara antes que el <Image> en el JSX, así que queda
  // debajo en el orden de pintado.
  const y = tamano * (vegetacion ? 0.74 : 0.7);
  return (
    <Canvas pointerEvents="none" style={[StyleSheet.absoluteFill, { height: tamano, width: tamano }]}>
      <Group opacity={vegetacion ? 0.3 : 0.32}>
        <Oval color="#0B3D1F" height={alto} width={ancho} x={x} y={y}>
          <BlurMask blur={desenfoque} style="normal" />
        </Oval>
      </Group>
    </Canvas>
  );
}

function SombraLampara() {
  return (
    <Canvas pointerEvents="none" style={styles.sombraLampara}>
      <Group opacity={0.18}>
        <Oval color="#0B3D1F" height={5} width={34} x={4} y={53}>
          <BlurMask blur={2.4} style="normal" />
        </Oval>
      </Group>
    </Canvas>
  );
}

function oscurecer(color: string, factor = 0.7) {
  const hex = color.replace('#', '');
  const canal = (inicio: number) => Math.round(parseInt(hex.slice(inicio, inicio + 2), 16) * factor).toString(16).padStart(2, '0');
  return `#${canal(0)}${canal(2)}${canal(4)}`;
}

// Fondo del mapa: antes un verde plano fijo ('#c4e7c6') sin importar el
// hábito — ahora una versión muy clara del color real (MasterPackColor del
// paquete asignado, o el color de siempre para hábitos sin paquete premium),
// para que el mapa se sienta del color del árbol sin perder legibilidad.
function aclarar(color: string, factor = 0.7) {
  const hex = color.replace('#', '');
  const canal = (inicio: number) => {
    const valor = parseInt(hex.slice(inicio, inicio + 2), 16);
    return Math.round(valor + (255 - valor) * factor).toString(16).padStart(2, '0');
  };
  return `#${canal(0)}${canal(2)}${canal(4)}`;
}


const TONOS_TOOLTIP_MASTER: Record<ColorMaster, { aurora: string; base: string; texto: string }> = {
  1: { aurora: '#60A5FA', base: '#3B82F6', texto: '#1D4ED8' },
  2: { aurora: '#4ADE80', base: '#22C55E', texto: '#15803D' },
  3: { aurora: '#FDE047', base: '#EAB308', texto: '#A16207' },
  4: { aurora: '#FDBA74', base: '#F97316', texto: '#C2410C' },
  5: { aurora: '#FB7185', base: '#EF4444', texto: '#BE123C' },
  6: { aurora: '#F9A8D4', base: '#EC4899', texto: '#BE185D' },
  7: { aurora: '#C4B5FD', base: '#8B5CF6', texto: '#6D28D9' },
};

// Versión breve de la aurora de Inicio: una sola pasada al montar el tooltip.
// Evita un loop permanente en un elemento que se abre/cierra con frecuencia.
function AuroraTooltip({ color }: { color: string }) {
  const progreso = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    progreso.setValue(0);
    const animacion = Animated.timing(progreso, { duration: 2400, toValue: 1, useNativeDriver: true });
    animacion.start();
    return () => animacion.stop();
  }, [progreso, color]);

  const desplazamiento = progreso.interpolate({ inputRange: [0, 1], outputRange: [-64, 42] });
  const opacidad = progreso.interpolate({ inputRange: [0, 0.16, 0.82, 1], outputRange: [0, 0.48, 0.32, 0] });

  return (
    <Animated.View pointerEvents="none" style={[styles.auroraTooltip, { opacity: opacidad, transform: [{ translateX: desplazamiento }] }]}>
      <Canvas pointerEvents="none" style={styles.auroraTooltipLienzo}>
        <Group opacity={0.72}>
          <PathSkia color={color} path="M-34 78 C58 18 126 116 211 60 S345 12 470 56" strokeWidth={16} style="stroke">
            <BlurMask blur={8} style="normal" />
          </PathSkia>
          <PathSkia color="#FFFFFF" path="M-42 112 C42 56 130 140 222 94 S354 39 462 80" strokeWidth={10} style="stroke">
            <BlurMask blur={6} style="normal" />
          </PathSkia>
        </Group>
      </Canvas>
    </Animated.View>
  );
}

// Acento curvo inspirado en el brillo inferior del PedestalNodo: conecta el
// tooltip con el nodo sin copiar su forma circular ni competir con el texto.
function AcentoTooltipNodo({ color }: { color: string }) {
  return (
    <Canvas pointerEvents="none" style={styles.acentoTooltipNodo}>
      <Group opacity={0.38}>
        <PathSkia color={color} path="M-18 104 C72 133 153 138 244 104 S350 76 382 92" strokeWidth={8} style="stroke">
          <BlurMask blur={9} style="normal" />
        </PathSkia>
      </Group>
      <Group opacity={0.28}>
        <PathSkia color="#FFFFFF" path="M-18 102 C72 131 153 136 244 102 S350 74 382 90" strokeWidth={1.8} style="stroke" />
      </Group>
    </Canvas>
  );
}

type CapaDecoracionMapaProps = {
  assetBrote: ImageSourcePropType | null;
  assetSemilla: ImageSourcePropType | null;
  categoriaId: CategoriaMapaId;
  colorMasterAmbiente: ColorMaster;
  finVentana: number;
  inicioVentana: number;
  mapa: MapaProcedural;
  nivel?: number;
  paqueteId?: string;
};

// Esta capa es deliberadamente independiente de nodos/SVG. React.memo evita
// volver a reconciliar sus imágenes costosas al seleccionar un nodo o animar
// una conexión; solo cambia al cruzar la ventana de scroll calculada arriba.
const CapaDecoracionMapa = React.memo(function CapaDecoracionMapa({
  assetBrote,
  assetSemilla,
  categoriaId,
  colorMasterAmbiente,
  finVentana,
  inicioVentana,
  mapa,
  nivel,
  paqueteId,
}: CapaDecoracionMapaProps) {
  const estaVisible = (arriba: number, alto: number) => arriba + alto >= inicioVentana && arriba <= finVentana;

  return (
    <View pointerEvents="none" style={[StyleSheet.absoluteFill, { zIndex: 1 }]}>
      {mapa.ambiente.map((item, indice) => {
        const tamano = 172 * item.escala;
        if (!estaVisible(item.y, tamano)) return null;
        return (
          <View
            key={`ambiente-${indice}`}
            style={[styles.ambiente, { height: tamano, left: item.x, top: item.y, width: tamano }]}
          >
            <SombraSuelo tamano={tamano} />
            <View style={{ height: tamano, opacity: item.opacidad, transform: [{ scaleX: item.volteado ? -1 : 1 }], width: tamano }}>
              <MasterChanger ancho={tamano} alto={tamano} colorDestino={colorMasterAmbiente} fit="contain" fuente={ASSETS_AMBIENTE_UNIVERSAL[item.assetId]} />
            </View>
          </View>
        );
      })}
      {assetSemilla && mapa.semillas.map((item, indice) => {
        const tamano = 172 * item.escala;
        if (!estaVisible(item.y, tamano)) return null;
        return (
          <View key={`semilla-${indice}`} style={[styles.ambiente, { height: tamano, left: item.x, top: item.y, width: tamano }]}>
            <SombraSuelo tamano={tamano} />
            <Image resizeMode="contain" source={assetSemilla} style={{ height: '100%', transform: [{ scaleX: item.volteado ? -1 : 1 }], width: '100%' }} />
          </View>
        );
      })}
      {assetBrote && mapa.brotes.map((item, indice) => {
        const tamano = 172 * item.escala;
        if (!estaVisible(item.y, tamano)) return null;
        return (
          <View key={`brote-${indice}`} style={[styles.ambiente, { height: tamano, left: item.x, top: item.y, width: tamano }]}>
            <SombraSuelo tamano={tamano} />
            <Image resizeMode="contain" source={assetBrote} style={{ height: '100%', transform: [{ scaleX: item.volteado ? -1 : 1 }], width: '100%' }} />
          </View>
        );
      })}
      {mapa.piedras.map((piedra, indice) => {
        if (!estaVisible(piedra.y, piedra.tamano)) return null;
        return (
          <View
            key={`piedras-${indice}`}
            style={[styles.piedras, {
              height: piedra.tamano,
              left: piedra.x,
              top: piedra.y,
              transform: [{ scaleX: piedra.espejoHorizontal }],
              width: piedra.tamano,
            }]}
          >
            <SombraSuelo tamano={piedra.tamano} />
            <MasterChanger ancho={piedra.tamano} alto={piedra.tamano} colorDestino={colorMasterAmbiente} fit="contain" fuente={ASSETS_AMBIENTE_UNIVERSAL[piedra.assetId]} />
          </View>
        );
      })}
      {mapa.decoraciones.map((decoracion, indice) => {
        const asset = obtenerAssetBioma(categoriaId, decoracion.assetId, paqueteId, nivel);
        if (!asset) return null;
        const tamano = 172 * decoracion.escala;
        if (!estaVisible(decoracion.y, tamano)) return null;
        return (
          <View
            key={`bioma-${decoracion.assetId}-${indice}`}
            style={[styles.decoracionBioma, {
              height: tamano,
              left: decoracion.x,
              opacity: decoracion.opacidad ?? 1,
              top: decoracion.y,
              width: tamano,
              zIndex: zIndexPorCapa[decoracion.capa],
            }]}
          >
            <SombraSuelo tamano={tamano} vegetacion />
            <Image
              resizeMode="contain"
              source={asset.fuente}
              style={[styles.decoracionBiomaImagen, { transform: [{ scaleX: decoracion.volteado ? -1 : 1 }] }]}
            />
          </View>
        );
      })}
      {mapa.lamparas.map((lampara, indice) => estaVisible(lampara.y, lampara.tamano)
        ? <DecoracionSendero key={`lampara-${indice}`} izquierda={lampara.x} tamano={lampara.tamano} arriba={lampara.y} />
        : null)}
    </View>
  );
});

export function ContenedorMapaSenderos({ altura, categoriaId, color, desplazamientoSuperior, enfocado, infoHabito, nivel, nodos: nodosOverride, onCompletarNodo, paqueteId, progresoPastoTemprano, subcategoriaId }: ContenedorMapaSenderosProps) {
  const { width } = useWindowDimensions();
  const router = useRouter();
  const scrollRef = useRef<ScrollView>(null);
  const [anchoMapa, setAnchoMapa] = useState(0);
  const [desplazamientoMapa, setDesplazamientoMapa] = useState(0);
  const desplazamientoDecoracionRef = useRef(0);
  const nodos = nodosOverride ?? obtenerNodosMapaMock(subcategoriaId);
  const ultimoCompletadoInicial = Math.max(-1, nodos.reduce((ultimo, nodo, indice) => nodo.estado === 'completado' ? indice : ultimo, -1));
  const [ultimoCompletado, setUltimoCompletado] = useState(ultimoCompletadoInicial);
  const indiceNodoActual = Math.min(nodos.length - 1, ultimoCompletado + 1);
  const idNodoActual = nodos[indiceNodoActual]?.id ?? '';
  const [seleccionado, setSeleccionado] = useState(idNodoActual);
  const [conexionEnCurso, setConexionEnCurso] = useState<number | null>(null);
  const progresoConexion = useRef(new Animated.Value(0)).current;
  const margenSuperiorEfectivo = desplazamientoSuperior ?? margenSuperior;
  const altoContenido = Math.max(altura, margenSuperiorEfectivo + Math.max(0, nodos.length - 1) * separacionVertical + 430);
  // El lienzo de nodos y conexiones nunca se virtualiza: es interactivo y
  // continuo. Toda vista de nivel usa la misma ventana de decoración; solo
  // cambian la cantidad de nodos y las etapas disponibles.
  const limitarDecoracion = nivel !== undefined;
  const margenDecoracion = Math.max(altura, 480);
  const anchoEscena = anchoMapa || width;
  const colorMasterAmbiente = useMemo(() => colorMasterMasCercano(color), [color]);
  const paqueteVisualMapa = categoriaId === 'habitos' ? resolverPaqueteHabito(paqueteId) : paqueteId;
  const tieneAssetsPaquete = categoriaId === 'habitos' ? tienePaqueteAssetsReales(paqueteVisualMapa ?? 'esmeralda') : false;
  const temaMapa = useMemo(
    () => crearTemaMapa(categoriaId, color, subcategoriaId, paqueteVisualMapa, nivel, progresoPastoTemprano, tieneAssetsPaquete),
    [categoriaId, color, subcategoriaId, paqueteVisualMapa, nivel, progresoPastoTemprano, tieneAssetsPaquete],
  );
  const assetSemilla = paqueteVisualMapa ? obtenerAssetSemillaPaquete(paqueteVisualMapa) : null;
  const assetBrote = paqueteVisualMapa ? obtenerAssetEtapaUnoPaquete(paqueteVisualMapa) : null;
  const mapa = useMemo(
    () => generarMapaProcedural({ ancho: anchoEscena, cantidadNodos: nodos.length, desplazamientoSuperior: margenSuperiorEfectivo, tema: temaMapa }),
    [anchoEscena, margenSuperiorEfectivo, nodos.length, temaMapa],
  );
  const posiciones = mapa.nodos;
  const conexiones = posiciones.slice(0, -1).map((posicion, indice) => {
    const siguiente = posiciones[indice + 1];
    const controlY = (posicion.y + siguiente.y) / 2;
    return {
      activa: nodos[indice + 1].estado !== 'bloqueado',
      d: `M ${posicion.x} ${posicion.y + 30} C ${posicion.x} ${controlY}, ${siguiente.x} ${controlY}, ${siguiente.x} ${siguiente.y - 30}`,
      id: `${posicion.id}-${siguiente.id}`,
    };
  });
  const nodoSeleccionado = nodos.find((nodo) => nodo.id === seleccionado);
  const indiceNodoSeleccionado = nodos.findIndex((nodo) => nodo.id === seleccionado);
  const posicionNodoSeleccionado = indiceNodoSeleccionado >= 0 ? posiciones[indiceNodoSeleccionado] : null;
  const estadoNodoSeleccionado: EstadoNodoMapa | null = indiceNodoSeleccionado < 0
    ? null
    : indiceNodoSeleccionado <= ultimoCompletado
      ? 'completado'
      : indiceNodoSeleccionado === indiceNodoActual
        ? 'activo'
        : 'bloqueado';
  const desplazamientoTrazo = progresoConexion.interpolate({ inputRange: [0, 1], outputRange: [176, 0] });

  if (nodos.length === 0) return null;

  function seleccionarNodo(id: string, indice: number) {
    setSeleccionado(id);
    if (enfocado) {
      const destino = Math.max(0, margenSuperiorEfectivo + indice * separacionVertical - altura * 0.34);
      scrollRef.current?.scrollTo({ animated: true, y: destino });
    }
  }

  function completarNodo(indice: number) {
    if (onCompletarNodo) { onCompletarNodo(nodos[indice], indice); return; }

    // MOCKUP: Al darle comenzar, navegamos a la pantalla de lección para ver el SDUI
    router.push({ pathname: '/senderos/leccion', params: { color } });
    return;

    if (indice !== indiceNodoActual || indice >= nodos.length - 1) return;

    setUltimoCompletado(indice);
    setSeleccionado(nodos[indice + 1].id);
    setConexionEnCurso(indice);
    progresoConexion.setValue(0);
    Animated.sequence([
      Animated.delay(180),
      Animated.timing(progresoConexion, { duration: 560, toValue: 1, useNativeDriver: false }),
    ]).start(({ finished }) => {
      if (finished) setConexionEnCurso(null);
    });
  }

  function medirAnchoMapa(ancho: number) {
    setAnchoMapa((actual) => Math.abs(actual - ancho) < 1 ? actual : ancho);
  }

  return (
    <View style={[styles.viewportPerspectiva, { backgroundColor: aclarar(color, 0.88) }]}>
    <ScrollView
      ref={scrollRef}
      nestedScrollEnabled
      onLayout={({ nativeEvent }) => medirAnchoMapa(nativeEvent.layout.width)}
      onScroll={({ nativeEvent }) => {
        if (!limitarDecoracion) return;
        const siguiente = nativeEvent.contentOffset.y;
        // Evita volver a reconciliar la escena a cada píxel: la ventana se
        // actualiza por bloques, con una pantalla completa de anticipación.
        if (Math.abs(siguiente - desplazamientoDecoracionRef.current) < 144) return;
        desplazamientoDecoracionRef.current = siguiente;
        setDesplazamientoMapa(siguiente);
      }}
      overScrollMode="never"
      scrollEventThrottle={96}
      scrollEnabled={true}
      showsVerticalScrollIndicator={false}
      style={[styles.raiz, { backgroundColor: aclarar(color, 0.88) }]}
      contentContainerStyle={[styles.contenido, { minHeight: altoContenido }]}
    >
      <TouchableWithoutFeedback onPress={() => setSeleccionado('')}>
      <View style={{ height: altoContenido, width: anchoEscena }}>
        
        {/* Bases Isométricas decorativas a los lados (FUERA de la perspectiva 3D para evitar aplastamiento).
            Los paquetes de árbol reales (aurelia, diamante...) no tienen arte de "base" propio —
            registroBiomas.ts sustituye la etapa actual (ej. etapa1.png) como placeholder, lo que acá
            se veía como un árbol gigante duplicado arriba del mapa. Mejor omitir del todo que mostrar
            ese sustituto fuera de lugar. */}
        {(() => {
           if (categoriaId === 'habitos' && tieneAssetsPaquete) return null;
           const assetBase = obtenerAssetBioma(categoriaId, 'base', paqueteId, nivel);
           if (!assetBase) return null;
           return (
             <View pointerEvents="none" style={[StyleSheet.absoluteFill, { zIndex: 0 }]}>
               {/* Bases grandes en la parte superior, más separadas */}
               <Image source={assetBase.fuente} style={{ position: 'absolute', top: -60, left: -50, width: 168, height: 168, opacity: 0.9, resizeMode: 'contain' }} />
               <Image source={assetBase.fuente} style={{ position: 'absolute', top: -30, right: -60, width: 182, height: 182, opacity: 0.9, resizeMode: 'contain', transform: [{ scaleX: -1 }] }} />
               
               
             </View>
           );
        })()}

        <CapaDecoracionMapa
          assetBrote={assetBrote}
          assetSemilla={assetSemilla}
          categoriaId={categoriaId}
          colorMasterAmbiente={colorMasterAmbiente}
          finVentana={limitarDecoracion ? desplazamientoMapa + altura + margenDecoracion : Number.POSITIVE_INFINITY}
          inicioVentana={limitarDecoracion ? desplazamientoMapa - margenDecoracion : Number.NEGATIVE_INFINITY}
          mapa={mapa}
          nivel={nivel}
          paqueteId={paqueteVisualMapa}
        />
        <Svg height={altoContenido} pointerEvents="none" style={[StyleSheet.absoluteFill, { zIndex: 2 }]} width={anchoEscena}>
          {conexiones.map((conexion, indice) => {
            const completa = indice < ultimoCompletado;
            const animando = conexionEnCurso === indice;
            return (
              <React.Fragment key={conexion.id}>
                <Path
                  d={conexion.d}
                  fill="none"
                  stroke={completa ? color : '#D2CEC8'}
                  strokeDasharray={completa ? undefined : '4 8'}
                  strokeLinecap="round"
                  strokeWidth={completa ? Math.max(3.5, 7 - indice * 0.7) : 3.5}
                />
                {animando ? (
                  <AnimatedPath
                    d={conexion.d}
                    fill="none"
                    stroke={color}
                    strokeDasharray="176 176"
                    strokeDashoffset={desplazamientoTrazo as any}
                    strokeLinecap="round"
                    strokeWidth={Math.max(3.5, 7 - indice * 0.7)}
                  />
                ) : null}
              </React.Fragment>
            );
          })}
        </Svg>

        {nodos.map((nodo, indice) => {
          const posicion = posiciones[indice];
          const esNodoActual = indice === indiceNodoActual;
          const esSeleccionado = seleccionado === nodo.id;
          const estadoVisual = indice <= ultimoCompletado ? 'completado' : esNodoActual ? 'activo' : 'bloqueado';
          const asentado = esSeleccionado && estadoVisual !== 'bloqueado';
          // Todos los nodos conservan el mismo peso visual: reducirlos por
          // índice hacía que los mapas largos parecieran encogerse al subir.
          const escalaEscena = 1;
          return (
            <View key={nodo.id} style={[styles.nodoPosicion, { left: posicion.x - 42, top: posicion.y - 48, zIndex: 20 }]}>
              <NodoSendero Icono={nodo.icono} asentado={asentado} color={color} escalaEscena={escalaEscena} estado={estadoVisual} seleccionado={esSeleccionado} onCompletar={() => completarNodo(indice)} onPress={() => seleccionarNodo(nodo.id, indice)} />
            </View>
          );
        })}
        {nodoSeleccionado && posicionNodoSeleccionado && estadoNodoSeleccionado ? (
          <TooltipNodoSeleccionado
            anchoEscena={anchoEscena}
            color={color}
            estado={estadoNodoSeleccionado}
            infoHabito={infoHabito}
            nodo={nodoSeleccionado}
            posicion={posicionNodoSeleccionado}
            onCompletar={() => completarNodo(indiceNodoSeleccionado)}
          />
        ) : null}
      </View></TouchableWithoutFeedback>

      {nodoSeleccionado ? <View accessibilityElementsHidden style={styles.lectorOculto}><Texto>{nodoSeleccionado.titulo}</Texto></View> : null}
    </ScrollView>
    </View>
  );
}

function TooltipNodoSeleccionado({ anchoEscena, color, estado, infoHabito, nodo, posicion, onCompletar }: {
  anchoEscena: number;
  color: string;
  estado: EstadoNodoMapa;
  infoHabito?: { meta: number; tipoMeta: TipoMetaHabito; unidad: string | null };
  nodo: NodoMapaSendero;
  posicion: { x: number; y: number };
  onCompletar: () => void;
}) {
  const { t } = useTranslation();
  const anchoTooltip = 340;
  const izquierdaTooltip = anchoEscena / 2 - anchoTooltip / 2;
  const izquierdaFlecha = posicion.x - izquierdaTooltip - 10;
  const IconoNodo = nodo.icono;
  const REFERENCIA_HUE = '#21A844';
  const PALETA_BASE = ['#B4DC9B', '#DEFCDD', '#B2EEB1', '#44B042', '#248723', '#53C35D', '#21A844', '#69C068', '#28A116'] as const;
  const PALETA_BLOQUEADA = ['#EDFFED', '#CDFACC', '#C8E0B8', '#E2FFE2', '#C0EEBF', '#206116', '#ADF1B3', '#8AE280'] as const;

  const colorBaseTooltip = estado === 'bloqueado' ? '#666666' : color;
  const colorFlechita = estado === 'bloqueado' ? '#444444' : color;
  const colorMaster = colorMasterMasCercano(color);
  
  const [colorTopeClaro, colorTopeOscuro] = estado === 'bloqueado'
    ? (() => {
        const paleta = rotarPaletaHex(PALETA_BLOQUEADA, REFERENCIA_HUE, color);
        return [paleta[6], paleta[7]];
      })()
    : (() => {
        const paleta = rotarPaletaHex(PALETA_BASE, REFERENCIA_HUE, color);
        return [paleta[5], paleta[6]];
      })();

  const colorBorde = 'rgba(255,255,255,0.2)';
  const tono = estado === 'bloqueado' ? { aurora: '#FFFFFF' } : TONOS_TOOLTIP_MASTER[colorMaster];
  const descripcionNodoHabito = !infoHabito
    ? t('senderos.map.genericDescription')
    : infoHabito.tipoMeta === 'check'
      ? t('senderos.map.checkDescription')
      : infoHabito.tipoMeta === 'duracion'
        ? t('senderos.map.durationDescription', { meta: infoHabito.meta })
        : t('senderos.map.quantityDescription', { meta: infoHabito.meta, unit: infoHabito.unidad ?? t('senderos.map.defaultUnit') });

  return (
    <View pointerEvents="box-none" style={[styles.etiqueta, { left: izquierdaTooltip, top: posicion.y + 40 }]}>
      <View style={[styles.tooltipFlechita, { backgroundColor: colorTopeClaro, left: izquierdaFlecha, position: 'absolute', top: -10 }]} />
      <View style={{ width: '100%' }}>
        <LinearGradient 
          colors={[colorTopeClaro, colorTopeOscuro]} 
          start={{ x: 0, y: 0.1 }} 
          end={{ x: 0, y: 1 }} 
          style={[styles.tooltipCaja, { borderWidth: 1, borderColor: colorBorde }]}
        >
          <AuroraTooltip color={tono.aurora} />
          <AcentoTooltipNodo color={colorBaseTooltip} />
          <View style={styles.tooltipContenido}>
          <View style={{ alignItems: 'center', flexDirection: 'row', gap: 8 }}>
            <IconoNodo color="#FFFFFF" size={20} />
            <Texto style={[styles.etiquetaTitulo, { color: '#FFFFFF', width: 'auto' }]}>{nodo.titulo}</Texto>
          </View>
          <Texto style={[styles.etiquetaMeta, { color: '#FFFFFF' }]}>{descripcionNodoHabito}</Texto>
          <MasterButton
            style={{ marginTop: 14, width: '100%' }}
            color={colorBaseTooltip}
            disabled={estado === 'bloqueado'}
            onPress={onCompletar}
            iconoDerecha={estado === 'completado' ? (props) => <PixelartIcon name="chevron-right" color={props.color} size={props.size} /> : undefined}
          >
            {estado === 'bloqueado' ? t('senderos.map.blocked') : estado === 'completado' ? t('senderos.map.review') : t('senderos.map.start')}
          </MasterButton>
          </View>
        </LinearGradient>
      </View>
    </View>
  );
}

function DecoracionSendero({ arriba, izquierda, tamano }: { arriba: number; izquierda: number; tamano: number }) {
  return (
    <View pointerEvents="none" style={[styles.decoracion, { left: izquierda, top: arriba, transform: [{ scale: tamano / 34 }], zIndex: 10 }]}>
      <SombraLampara />
      <Image
        resizeMode="contain"
        source={ASSETS_AMBIENTE_UNIVERSAL.roca1}
        style={styles.piedraBaseLampara}
      />
      <View style={styles.lamparaSobrePiedra}>
        <LamparaSendero retraso={arriba} tamano={34} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  raiz: {
    backgroundColor: '#c4e7c6',
  },
  contenido: {
    position: 'relative',
  },
  viewportPerspectiva: {
    flex: 1,
    overflow: 'hidden',
    transform: [{ perspective: 1200 }, { rotateX: '7deg' }, { scaleY: 0.98 }],
    transformOrigin: 'center bottom',
  },
  ambiente: {
    position: 'absolute',
    zIndex: 0,
  },
  piedras: {
    position: 'absolute',
    zIndex: 2,
  },
  decoracionBioma: {
    opacity: 0.96,
    position: 'absolute',
  },
  decoracionBiomaImagen: {
    height: '100%',
    width: '100%',
  },
  decoracion: {
    alignItems: 'center',
    height: 40,
    overflow: 'visible',
    position: 'absolute',
    width: 34,
  },
  piedraBaseLampara: {
    height: 24,
    left: -4,
    position: 'absolute',
    top: 38,
    width: 42,
    zIndex: 1,
  },
  lamparaSobrePiedra: {
    zIndex: 2,
  },
  sombraLampara: {
    height: 64,
    left: -4,
    position: 'absolute',
    top: 0,
    width: 42,
    zIndex: 0,
  },
  tooltipCaja: {
    alignItems: 'flex-start',
    borderRadius: 16,
    elevation: 10,
    overflow: 'hidden',
    position: 'relative',
    width: '100%',
  },
  tooltipContenido: {
    alignItems: 'flex-start',
    paddingBottom: 20,
    paddingHorizontal: 20,
    paddingTop: 20,
    width: '100%',
  },
  auroraTooltip: {
    height: 126,
    left: -58,
    position: 'absolute',
    top: -18,
    width: 440,
  },
  auroraTooltipLienzo: {
    height: 126,
    width: 440,
  },
  acentoTooltipNodo: {
    bottom: -26,
    height: 120,
    left: 0,
    position: 'absolute',
    right: 0,
  },
  tooltipFlechita: {
    width: 24,
    height: 24,
    transform: [{ rotate: '45deg' }],
    zIndex: 1,
  },

  botonComenzarContenedor: {
    width: '100%',
    height: 44, // Fixed height to prevent layout jumps
    alignItems: 'center',
    zIndex: 2,
  },
  botonComenzar: {
    alignItems: 'center',
    height: 40,
    justifyContent: 'center',
    width: '100%',
  },
  botonContenido: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    width: '100%',
  },
  textoBoton: {
    fontFamily: 'MontserratAlternates-Bold',
    fontSize: 13,
  },
  etiqueta: {
    alignItems: 'center',
    elevation: 30,
    position: 'absolute',
    top: 76,
    width: 340,
    maxWidth: 400,
    zIndex: 1000,
  },
  etiquetaMeta: {
    fontFamily: 'MontserratAlternates-Medium',
    fontSize: 12,
    lineHeight: 16,
    color: 'rgba(255, 255, 255, 0.85)',
    marginTop: 4,
    marginBottom: 4,
    textAlign: 'left',
    width: '100%',
  },
  etiquetaTitulo: {
    color: '#FFFFFF',
    fontFamily: 'MontserratAlternates-Bold',
    fontSize: 16,
    textAlign: 'left',
    width: '100%',
  },
  lectorOculto: {
    height: 0,
    opacity: 0,
    overflow: 'hidden',
    width: 0,
  },
  nodoPosicion: {
    alignItems: 'center',
    position: 'absolute',
    width: 72,
  },
});
