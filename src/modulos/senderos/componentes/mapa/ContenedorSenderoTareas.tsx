import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Image, type ImageSourcePropType, ScrollView, StyleSheet, useWindowDimensions, View, Pressable, TouchableWithoutFeedback } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { BlurMask, Canvas, Group, Oval, Path as PathSkia } from '@shopify/react-native-skia';

import { MasterGlass, MasterButton, Texto } from '../../../../diseno';
import { colorMasterMasCercano, MasterChanger, type ColorMaster } from '../../../../diseno/componentes/MasterChanger';
import { crearTemaMapa, generarMapaProcedural, type MapaProcedural } from '../../algoritmo/mapaProcedural';
import { ASSETS_AMBIENTE_UNIVERSAL, construirAssetsArbolPorNivel, obtenerAssetEtapaUnoPaquete, obtenerAssetSemillaPaquete } from '../../algoritmo/registroBiomas';
import { obtenerNodosMapaMock } from '../../datos/mapaEjercicio.mock';
import type { EstadoNodoMapa, NodoMapaSendero } from '../../datos/mapaEjercicio.mock';
import { PixelartIcon } from '../../../../diseno/iconos/PixelartIcon';
import { LamparaSendero } from './LamparaSendero';
import { LinearGradient } from 'expo-linear-gradient';
import { rotarPaletaHex } from '../../algoritmo/colorHsl';
import { resolverPaqueteHabito } from '../../../habitos/paqueteHabito';
import { useTranslation } from 'react-i18next';

import { NodoSendero } from './NodoSendero';
import { NodoCofreSendero } from './NodoCofreSendero';
import type { TrazoFigura } from '../../../tareas/tareas.tipos';
import { NodoFiguraPedestal } from './NodoFiguraPedestal';
import { CompositorOverlaySello, type DestinoMapa } from './CompositorOverlaySello';
import { CAMARA_MAPA } from './camaraMapa';
import type { InfoCofre } from '../../datos/mapaEjercicio.mock';
import { useEscala } from '../../../../diseno/tema/MasterColorContext';
import type { EscalaMaster } from '../../../../diseno/tema/escalaEsmeralda';
import { ESCALA_ESMERALDA } from '../../../../diseno/tema/escalaEsmeralda';

/**
 * Fork de ContenedorMapaSenderos.tsx para el sendero de días de Tareas
 * (Fase 8): mismo motor de mapa/decoraciones/cámara isométrica, pero
 * siempre con árbol dinámico por nivel/paquete (nunca bioma fijo — eso lo
 * sigue usando el sendero de pasos de checklist, Fase 7, a través del
 * componente original) y con el ritual de la figura (CompositorOverlaySello)
 * en vez del mandala. Se forkeó en vez de agregar más ramas condicionales al
 * componente que hoy corre en producción para Hábitos — mismo criterio que
 * ya se usó para CompositorOverlay → CompositorOverlaySello.
 */
type ContenedorSenderoTareasProps = {
  altura: number;
  color: string;
  enfocado: boolean;
  nodos?: NodoMapaSendero[];
  onCompletarNodo?: (nodo: NodoMapaSendero, indice: number) => void;
  subcategoriaId: string;
  /** Nivel real 1-7 de la tarea — define qué etapas de crecimiento del árbol se mezclan. */
  nivel: number;
  /** Paquete de árbol asignado a la tarea (mismo catálogo que Hábitos). */
  paqueteId?: string | null;
  desplazamientoSuperior?: number;
  /** master_pack_color crudo del paquete — ver mismo prop en ContenedorMapaSenderos.tsx. */
  colorPaquete?: string;
  /** Figura recién ganada: el mapa abre el ritual sobre su pedestal en cuanto el nodo aparece. */
  encargoFigura?: { registroId: string } | null;
  onEncargoFiguraConsumido?: () => void;
  onRitualActivo?: (activo: boolean) => void;
};

type RitualFigura = { anclado: boolean; color: string; emergido: boolean; overlayVisible: boolean; registroId: string };

const separacionVertical = 112;
const margenSuperior = 222;
const zIndexPorCapa = { fondo: 1, medio: 3, frente: 4 } as const;

function SombraSuelo({ tamano, vegetacion = false }: { tamano: number; vegetacion?: boolean }) {
  const esc = useEscala();
  const ancho = Math.max(vegetacion ? 14 : 12, tamano * (vegetacion ? 0.5 : 0.44));
  const alto = Math.max(vegetacion ? 3 : 2.5, tamano * (vegetacion ? 0.085 : 0.1));
  const desenfoque = Math.max(1.5, tamano * (vegetacion ? 0.045 : 0.05));
  const x = (tamano - ancho) / 2;
  const y = tamano * (vegetacion ? 0.74 : 0.7);
  return (
    <Canvas pointerEvents="none" style={[StyleSheet.absoluteFill, { height: tamano, width: tamano }]}>
      <Group opacity={vegetacion ? 0.3 : 0.32}>
        <Oval color={esc.hoja.l22} height={alto} width={ancho} x={x} y={y}>
          <BlurMask blur={desenfoque} style="normal" />
        </Oval>
      </Group>
    </Canvas>
  );
}

function SombraLampara() {
  const esc = useEscala();
  const styles = useEstilosStyles();
  return (
    <Canvas pointerEvents="none" style={styles.sombraLampara}>
      <Group opacity={0.18}>
        <Oval color={esc.hoja.l22} height={5} width={34} x={4} y={53}>
          <BlurMask blur={2.4} style="normal" />
        </Oval>
      </Group>
    </Canvas>
  );
}

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
  2: { aurora: ESCALA_ESMERALDA.jade.l79, base: ESCALA_ESMERALDA.jade.l70, texto: ESCALA_ESMERALDA.jade.l49 },
  3: { aurora: '#FDE047', base: '#EAB308', texto: '#A16207' },
  4: { aurora: '#FDBA74', base: '#F97316', texto: '#C2410C' },
  5: { aurora: '#FB7185', base: '#EF4444', texto: '#BE123C' },
  6: { aurora: '#F9A8D4', base: '#EC4899', texto: '#BE185D' },
  7: { aurora: '#C4B5FD', base: '#8B5CF6', texto: '#6D28D9' },
};

function AuroraTooltip({ color }: { color: string }) {
  const styles = useEstilosStyles();
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

function AcentoTooltipNodo({ color }: { color: string }) {
  const styles = useEstilosStyles();
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
  colorMasterAmbiente: ColorMaster;
  finVentana: number;
  inicioVentana: number;
  mapa: MapaProcedural;
  nivel: number;
  paqueteId: string;
};

const CapaDecoracionMapa = React.memo(function CapaDecoracionMapa({
  assetBrote,
  assetSemilla,
  colorMasterAmbiente,
  finVentana,
  inicioVentana,
  mapa,
  nivel,
  paqueteId,
}: CapaDecoracionMapaProps) {
  const styles = useEstilosStyles();
  const estaVisible = (arriba: number, alto: number) => arriba + alto >= inicioVentana && arriba <= finVentana;
  const assetsArbol = useMemo(() => construirAssetsArbolPorNivel(paqueteId, nivel), [paqueteId, nivel]);
  const obtenerAsset = (id: string) => assetsArbol.find((asset) => asset.id === id) ?? null;

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
        const asset = obtenerAsset(decoracion.assetId);
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

export function ContenedorSenderoTareas({ altura, color, colorPaquete, desplazamientoSuperior, enfocado, encargoFigura, nivel, nodos: nodosOverride, onCompletarNodo, onEncargoFiguraConsumido, onRitualActivo, paqueteId, subcategoriaId }: ContenedorSenderoTareasProps) {
  const colorCofre = colorPaquete ?? color;
  const styles = useEstilosStyles();
  const { width } = useWindowDimensions();
  const scrollRef = useRef<ScrollView>(null);
  const [anchoMapa, setAnchoMapa] = useState(0);
  const [desplazamientoMapa, setDesplazamientoMapa] = useState(0);
  const desplazamientoDecoracionRef = useRef(0);
  const [ritual, setRitual] = useState<RitualFigura | null>(null);
  // Trazos recién anclados, mientras la consulta de figuras se refresca: el
  // pedestal debe mostrar la figura en el mismo cuadro en que aterriza.
  const [trazosAnclados, setTrazosAnclados] = useState<Map<string, TrazoFigura[]>>(() => new Map());
  const anclasFiguraRef = useRef(new Map<string, View>());
  const contenidoRef = useRef<View>(null);
  const scrollYRef = useRef(0);
  const altoScrollRef = useRef(0);
  const paqueteVisualMapa = resolverPaqueteHabito(paqueteId ?? undefined);
  const nodosBase = nodosOverride ?? obtenerNodosMapaMock(subcategoriaId);
  const nodos = useMemo(() => trazosAnclados.size === 0 ? nodosBase : nodosBase.map((nodo) => {
    const trazos = nodo.figura ? trazosAnclados.get(nodo.figura.registroId) : undefined;
    return trazos && nodo.figura ? { ...nodo, figura: { ...nodo.figura, estado: 'creada' as const, trazos } } : nodo;
  }), [nodosBase, trazosAnclados]);
  const ultimoCompletado = Math.max(-1, nodos.reduce((ultimo, nodo, indice) => nodo.estado === 'completado' ? indice : ultimo, -1));
  const indiceNodoActual = Math.min(nodos.length - 1, ultimoCompletado + 1);
  const idNodoActual = nodos[indiceNodoActual]?.id ?? '';
  const [seleccionado, setSeleccionado] = useState(idNodoActual);
  const idNodoActualRef = useRef(idNodoActual);
  useEffect(() => {
    if (idNodoActualRef.current === idNodoActual) return;
    idNodoActualRef.current = idNodoActual;
    setSeleccionado(idNodoActual);
  }, [idNodoActual]);
  const margenSuperiorEfectivo = desplazamientoSuperior ?? margenSuperior;
  const altoContenido = Math.max(altura, margenSuperiorEfectivo + Math.max(0, nodos.length - 1) * separacionVertical + 430);
  const margenDecoracion = Math.max(altura, 480);
  const anchoEscena = anchoMapa || width;
  const colorMasterAmbiente = useMemo(() => colorMasterMasCercano(color), [color]);
  const temaMapa = useMemo(
    () => crearTemaMapa('tareas', color, subcategoriaId, paqueteVisualMapa, nivel, undefined, true),
    [color, subcategoriaId, paqueteVisualMapa, nivel],
  );
  const assetSemilla = obtenerAssetSemillaPaquete(paqueteVisualMapa);
  const assetBrote = obtenerAssetEtapaUnoPaquete(paqueteVisualMapa);
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
        ? nodos[indiceNodoSeleccionado].estado
        : 'bloqueado';
  // La más reciente de las figuras creadas es la que gira sola.
  const indiceUltimaFigura = nodos.reduce((ultimo, nodo, indice) => nodo.figura?.estado === 'creada' ? indice : ultimo, -1);

  function abrirRitual(figura: NonNullable<NodoMapaSendero['figura']>, indice: number) {
    if (ritual) return;
    onRitualActivo?.(true);
    setSeleccionado('');
    enfocarNodo(indice);
    setRitual({ anclado: false, color: figura.color ?? colorCofre, emergido: false, overlayVisible: true, registroId: figura.registroId });
  }

  const ritualConcluido = ritual !== null && !ritual.overlayVisible && (ritual.emergido || !ritual.anclado);
  useEffect(() => {
    if (ritualConcluido) setRitual(null);
  }, [ritualConcluido]);

  const esperandoEmergencia = ritual !== null && ritual.anclado && !ritual.emergido;
  useEffect(() => {
    if (!esperandoEmergencia) return;
    const plazo = setTimeout(() => setRitual((actual) => actual && { ...actual, emergido: true }), 3000);
    return () => clearTimeout(plazo);
  }, [esperandoEmergencia]);

  const ritualActivo = ritual !== null;
  useEffect(() => {
    onRitualActivo?.(ritualActivo);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ritualActivo]);

  useEffect(() => {
    if (!encargoFigura || !enfocado || ritual) return;
    const indice = nodos.findIndex((nodo) => nodo.figura?.registroId === encargoFigura.registroId);
    if (indice < 0) return;
    const figura = nodos[indice].figura!;
    onEncargoFiguraConsumido?.();
    if (figura.estado === 'pendiente') abrirRitual(figura, indice);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [encargoFigura, enfocado, nodos, ritual]);

  function medirAnclaFigura(registroId: string) {
    return new Promise<DestinoMapa | null>((resolver) => {
      const ancla = anclasFiguraRef.current.get(registroId);
      const contenido = contenidoRef.current;
      if (!ancla || !contenido) { resolver(null); return; }
      ancla.measureLayout(
        contenido,
        (izquierda, arriba, ancho, alto) => resolver({ tamano: ancho, x: izquierda + ancho / 2, y: arriba + alto / 2 - scrollYRef.current }),
        () => resolver(null),
      );
    });
  }

  if (nodos.length === 0) return null;

  function enfocarNodo(indice: number) {
    if (!enfocado) return;
    const destino = Math.max(0, margenSuperiorEfectivo + indice * separacionVertical - altura * 0.34);
    scrollRef.current?.scrollTo({ animated: true, y: destino });
    if (altoScrollRef.current > 0) scrollYRef.current = Math.min(destino, Math.max(0, altoContenido - altoScrollRef.current));
  }

  function seleccionarNodo(id: string, indice: number) {
    setSeleccionado(id);
    enfocarNodo(indice);
  }

  function completarNodo(indice: number) {
    if (onCompletarNodo) { onCompletarNodo(nodos[indice], indice); return; }
  }

  function medirAnchoMapa(ancho: number) {
    setAnchoMapa((actual) => Math.abs(actual - ancho) < 1 ? actual : ancho);
  }

  return (
    <View style={styles.escenario}>
    <View style={[styles.viewportPerspectiva, { backgroundColor: aclarar(color, 0.88) }]}>
    <ScrollView
      ref={scrollRef}
      nestedScrollEnabled
      onLayout={({ nativeEvent }) => {
        altoScrollRef.current = nativeEvent.layout.height;
        medirAnchoMapa(nativeEvent.layout.width);
      }}
      onScroll={({ nativeEvent }) => {
        scrollYRef.current = nativeEvent.contentOffset.y;
        const siguiente = nativeEvent.contentOffset.y;
        if (Math.abs(siguiente - desplazamientoDecoracionRef.current) < 144) return;
        desplazamientoDecoracionRef.current = siguiente;
        setDesplazamientoMapa(siguiente);
      }}
      overScrollMode="never"
      scrollEventThrottle={96}
      scrollEnabled={!ritual}
      showsVerticalScrollIndicator={false}
      style={[styles.raiz, { backgroundColor: aclarar(color, 0.88) }]}
      contentContainerStyle={[styles.contenido, { minHeight: altoContenido }]}
    >
      <TouchableWithoutFeedback onPress={() => setSeleccionado('')}>
      <View collapsable={false} ref={contenidoRef} style={{ height: altoContenido, width: anchoEscena }}>

        <CapaDecoracionMapa
          assetBrote={assetBrote}
          assetSemilla={assetSemilla}
          colorMasterAmbiente={colorMasterAmbiente}
          finVentana={desplazamientoMapa + altura + margenDecoracion}
          inicioVentana={desplazamientoMapa - margenDecoracion}
          mapa={mapa}
          nivel={nivel}
          paqueteId={paqueteVisualMapa}
        />
        <Svg height={altoContenido} pointerEvents="none" style={[StyleSheet.absoluteFill, { zIndex: 2 }]} width={anchoEscena}>
          {conexiones.map((conexion, indice) => {
            const completa = indice < ultimoCompletado;
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
              </React.Fragment>
            );
          })}
        </Svg>

        {nodos.map((nodo, indice) => {
          const posicion = posiciones[indice];
          const esNodoActual = indice === indiceNodoActual;
          const esSeleccionado = seleccionado === nodo.id;
          const estadoVisual = indice <= ultimoCompletado ? 'completado' : esNodoActual ? nodo.estado : 'bloqueado';
          const asentado = esSeleccionado && estadoVisual !== 'bloqueado';
          const escalaEscena = 1;

          if (nodo.tipoNodo === 'cofre_final') {
            const cofreInfo = nodo.cofre ?? {
              ciclo: 1,
              estadoCofre: estadoVisual === 'completado' ? 'reclamado' : 'bloqueado',
              gemasMax: 15,
              gemasMin: 8,
              nodoDia: indice + 1,
              tipo: 'final' as const,
            };
            return (
              <View key={nodo.id} style={[styles.nodoPosicion, { left: posicion.x - 42, top: posicion.y - 48, zIndex: 20 }]}>
                <NodoCofreSendero
                  bloqueado={cofreInfo.estadoCofre === 'bloqueado'}
                  cofre={cofreInfo}
                  color={color}
                  colorPaquete={colorCofre}
                  escalaEscena={escalaEscena}
                  onPress={() => seleccionarNodo(nodo.id, indice)}
                  seleccionado={esSeleccionado}
                />
              </View>
            );
          }

          if (nodo.tipoNodo === 'orbe_figura' && nodo.figura) {
            const figura = nodo.figura;
            return (
              <View key={nodo.id} style={[styles.nodoPosicion, { left: posicion.x - 42, top: posicion.y - 48, zIndex: 20 }]}>
                <NodoFiguraPedestal
                  color={figura.color ?? colorCofre}
                  destacada={indice === indiceUltimaFigura}
                  particulas={indice === indiceUltimaFigura
                    ? 'plenas'
                    : Math.abs(posicion.y - (desplazamientoMapa + altura / 2)) < altura / 2 + margenDecoracion / 2 ? 'suaves' : 'ninguna'}
                  escalaEscena={escalaEscena}
                  figura={figura}
                  emergiendo={ritual?.registroId === figura.registroId && ritual.anclado && !ritual.emergido}
                  oculta={ritual?.registroId === figura.registroId && !ritual.anclado}
                  onEmergido={() => setRitual((actual) => actual && actual.registroId === figura.registroId ? { ...actual, emergido: true } : actual)}
                  onPress={() => {
                    if (figura.estado === 'pendiente') { abrirRitual(figura, indice); return; }
                    seleccionarNodo(nodo.id, indice);
                  }}
                  ref={(vista) => {
                    if (vista) anclasFiguraRef.current.set(figura.registroId, vista);
                    else anclasFiguraRef.current.delete(figura.registroId);
                  }}
                />
              </View>
            );
          }

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
            nodo={nodoSeleccionado}
            posicion={posicionNodoSeleccionado}
            onCompletar={() => completarNodo(indiceNodoSeleccionado)}
          />
        ) : null}
      </View></TouchableWithoutFeedback>

      {nodoSeleccionado ? <View accessibilityElementsHidden style={styles.lectorOculto}><Texto>{nodoSeleccionado.titulo}</Texto></View> : null}
    </ScrollView>
    </View>
    {/* Fuera del viewport inclinado: el ritual queda plano frente a la cámara. */}
    {ritual?.overlayVisible && (
      <CompositorOverlaySello
        color={ritual.color}
        key={ritual.registroId}
        medirDestino={() => medirAnclaFigura(ritual.registroId)}
        onAnclado={(trazos) => {
          setTrazosAnclados((actuales) => new Map(actuales).set(ritual.registroId, trazos));
          setRitual((actual) => actual && { ...actual, anclado: true });
        }}
        onCancelado={() => setRitual(null)}
        onTerminado={() => setRitual((actual) => actual && { ...actual, overlayVisible: false })}
        registroId={ritual.registroId}
        tareaId={subcategoriaId}
      />
    )}
    </View>
  );
}

function TooltipNodoSeleccionado({ anchoEscena, color, estado, nodo, posicion, onCompletar }: {
  anchoEscena: number;
  color: string;
  estado: EstadoNodoMapa;
  nodo: NodoMapaSendero;
  posicion: { x: number; y: number };
  onCompletar: () => void;
}) {
  const esc = useEscala();
  const styles = useEstilosStyles();
  const { t } = useTranslation();
  const anchoTooltip = 340;
  const izquierdaTooltip = anchoEscena / 2 - anchoTooltip / 2;
  const izquierdaFlecha = posicion.x - izquierdaTooltip - 10;
  const IconoNodo = nodo.icono;
  const REFERENCIA_HUE = esc.hoja.l61a;
  const PALETA_BASE = [esc.lima.l84, esc.lima.l94, esc.lima.l89, esc.hoja.l64a, esc.hoja.l49, esc.hoja.l71a, esc.hoja.l61a, esc.hoja.l69, esc.lima.l58] as const;
  const PALETA_BLOQUEADA = [esc.lima.l99a, esc.hoja.l90, esc.lima.l87a, esc.hoja.l93, esc.hoja.l90, esc.lima.l40, esc.hoja.l89, esc.lima.l83] as const;

  const esApagado = estado === 'bloqueado' || estado === 'esperando';
  const colorBaseTooltip = esApagado ? '#666666' : color;
  const colorFlechita = esApagado ? '#444444' : color;
  const colorMaster = colorMasterMasCercano(color);

  const [colorTopeClaro, colorTopeOscuro] = esApagado
    ? (() => {
        const paleta = rotarPaletaHex(PALETA_BLOQUEADA, REFERENCIA_HUE, color);
        return [paleta[6], paleta[7]];
      })()
    : (() => {
        const paleta = rotarPaletaHex(PALETA_BASE, REFERENCIA_HUE, color);
        return [paleta[5], paleta[6]];
      })();

  const colorBorde = 'rgba(255,255,255,0.2)';
  const tono = esApagado ? { aurora: '#FFFFFF' } : TONOS_TOOLTIP_MASTER[colorMaster];
  const esCofre = nodo.tipoNodo === 'cofre_final';
  const cofreInfo = nodo.cofre;
  const descripcionFinal = esCofre
    ? cofreInfo?.estadoCofre === 'reclamado'
      ? `Cofre ya reclamado (+${cofreInfo.gemasReclamadas ?? cofreInfo.gemasMin} gemas).`
      : 'Completa los días de constancia previos para desbloquear este cofre.'
    : t('senderos.map.genericDescription');

  const botonDeshabilitado = esCofre ? true : estado === 'bloqueado' || estado === 'esperando';

  const textoBoton = esCofre
    ? cofreInfo?.estadoCofre === 'reclamado'
      ? 'Reclamado'
      : t('senderos.map.blocked')
    : estado === 'bloqueado'
      ? t('senderos.map.blocked')
      : estado === 'esperando'
        ? t('senderos.map.waitingTomorrow')
        : estado === 'completado'
          ? t('senderos.map.review')
          : t('senderos.map.start');

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
          <Texto style={[styles.etiquetaMeta, { color: '#FFFFFF' }]}>{descripcionFinal}</Texto>
          <MasterButton
            style={{ marginTop: 14, width: '100%' }}
            color={colorBaseTooltip}
            disabled={botonDeshabilitado}
            onPress={onCompletar}
            iconoDerecha={!esCofre && estado === 'completado' ? (props) => <PixelartIcon name="chevron-right" color={props.color} size={props.size} /> : undefined}
          >
            {textoBoton}
          </MasterButton>
          </View>
        </LinearGradient>
      </View>
    </View>
  );
}

function DecoracionSendero({ arriba, izquierda, tamano }: { arriba: number; izquierda: number; tamano: number }) {
  const styles = useEstilosStyles();
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

const crearEstilosStyles = (esc: EscalaMaster) => StyleSheet.create({
  raiz: {
    backgroundColor: esc.hoja.l91,
  },
  contenido: {
    position: 'relative',
  },
  escenario: {
    flex: 1,
  },
  viewportPerspectiva: {
    flex: 1,
    overflow: 'hidden',
    transform: [{ perspective: CAMARA_MAPA.perspectiva }, { rotateX: `${CAMARA_MAPA.inclinacionGrados}deg` }, { scaleY: CAMARA_MAPA.escalaY }],
    transformOrigin: CAMARA_MAPA.origen,
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

const estilosPorEscalaStyles = new WeakMap<EscalaMaster, ReturnType<typeof crearEstilosStyles>>();

function useEstilosStyles() {
  const esc = useEscala();
  let valor = estilosPorEscalaStyles.get(esc);
  if (!valor) {
    valor = crearEstilosStyles(esc);
    estilosPorEscalaStyles.set(esc, valor);
  }
  return valor;
}
