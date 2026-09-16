import React, { useMemo, useRef, useState } from 'react';
import { Animated, Image, type ImageSourcePropType, ScrollView, StyleSheet, useWindowDimensions, View, Pressable, TouchableWithoutFeedback } from 'react-native';
import { useRouter } from 'expo-router';
import Svg, { Path, Rect, Defs, Pattern } from 'react-native-svg';
import { BlurMask, Canvas, Group, Oval } from '@shopify/react-native-skia';

import { Texto } from '../../../../diseno';
import { colorMasterMasCercano, MasterChanger, type ColorMaster } from '../../../../diseno/componentes/MasterChanger';
import { crearTemaMapa, generarMapaProcedural, type CategoriaMapaId, type MapaProcedural } from '../../algoritmo/mapaProcedural';
import { ASSETS_AMBIENTE_UNIVERSAL, obtenerAssetBioma, obtenerAssetEtapaUnoPaquete, obtenerAssetSemillaPaquete, registroBiomas, tienePaqueteAssetsReales } from '../../algoritmo/registroBiomas';
import { obtenerNodosMapaMock } from '../../datos/mapaEjercicio.mock';
import type { EstadoNodoMapa, NodoMapaSendero } from '../../datos/mapaEjercicio.mock';
import { PixelartIcon } from '../../../../diseno/iconos/PixelartIcon';
import { LamparaSendero } from './LamparaSendero';

import { NodoSendero } from './NodoSendero';

type ContenedorMapaSenderosProps = {
  altura: number;
  categoriaId: CategoriaMapaId;
  color: string;
  enfocado: boolean;
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


const MosaicoTooltip = () => (
  <View style={StyleSheet.absoluteFill} pointerEvents="none">
    <Svg width="100%" height="100%">
      <Defs>
        <Pattern id="ditherMosaico" patternUnits="userSpaceOnUse" width="8" height="8">
          <Rect x="4" y="0" width="4" height="4" fill="#000000" opacity="0.04" />
          <Rect x="0" y="4" width="4" height="4" fill="#000000" opacity="0.04" />
          <Rect x="0" y="0" width="4" height="4" fill="#FFFFFF" opacity="0.05" />
          <Rect x="4" y="4" width="4" height="4" fill="#FFFFFF" opacity="0.05" />
        </Pattern>
      </Defs>
      {/* Triángulo/Degradado podría ser complejo, pero un rectángulo simple cortado por un radio funciona */}
      <Rect width="100%" height="100%" fill="url(#ditherMosaico)" />
    </Svg>
  </View>
);

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

export function ContenedorMapaSenderos({ altura, categoriaId, color, enfocado, nivel, nodos: nodosOverride, onCompletarNodo, paqueteId, progresoPastoTemprano, subcategoriaId }: ContenedorMapaSenderosProps) {
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
  const altoContenido = Math.max(altura, margenSuperior + Math.max(0, nodos.length - 1) * separacionVertical + 430);
  // El lienzo de nodos y conexiones nunca se virtualiza: es interactivo y
  // continuo. En mapas 3+ solo se cierra la ventana de decoración lejana.
  const limitarDecoracion = (nivel ?? 1) >= 3;
  const margenDecoracion = Math.max(altura, 480);
  const anchoEscena = anchoMapa || width;
  const colorMasterAmbiente = useMemo(() => colorMasterMasCercano(color), [color]);
  const tieneAssetsPaquete = paqueteId ? tienePaqueteAssetsReales(paqueteId) : false;
  const temaMapa = useMemo(
    () => crearTemaMapa(categoriaId, color, subcategoriaId, paqueteId, nivel, progresoPastoTemprano, tieneAssetsPaquete),
    [categoriaId, color, subcategoriaId, paqueteId, nivel, progresoPastoTemprano, tieneAssetsPaquete],
  );
  const assetSemilla = paqueteId ? obtenerAssetSemillaPaquete(paqueteId) : null;
  const assetBrote = paqueteId ? obtenerAssetEtapaUnoPaquete(paqueteId) : null;
  const mapa = useMemo(() => generarMapaProcedural({ ancho: anchoEscena, cantidadNodos: nodos.length, tema: temaMapa }), [anchoEscena, nodos.length, temaMapa]);
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
      const destino = Math.max(0, margenSuperior + indice * separacionVertical - altura * 0.34);
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
          paqueteId={paqueteId}
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
          const asentado = esSeleccionado;
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

function TooltipNodoSeleccionado({ anchoEscena, color, estado, nodo, posicion, onCompletar }: {
  anchoEscena: number;
  color: string;
  estado: EstadoNodoMapa;
  nodo: NodoMapaSendero;
  posicion: { x: number; y: number };
  onCompletar: () => void;
}) {
  const anchoTooltip = 340;
  const izquierdaTooltip = anchoEscena / 2 - anchoTooltip / 2;
  const izquierdaFlecha = posicion.x - izquierdaTooltip - 10;
  const IconoNodo = nodo.icono;

  return (
    <View pointerEvents="box-none" style={[styles.etiqueta, { left: izquierdaTooltip, top: posicion.y + 40 }]}>
      <View style={[styles.tooltipFlechita, { backgroundColor: oscurecer(color, 0.75), left: izquierdaFlecha, position: 'absolute', top: -10 }]} />
      <View style={{ width: '100%' }}>
        <View style={[styles.tooltipCaja, { backgroundColor: oscurecer(color, 0.4), bottom: -6, left: 0, position: 'absolute', right: 0, shadowColor: 'transparent', top: 6 }]} />
        <View style={[styles.tooltipCaja, { backgroundColor: oscurecer(color, 0.75), overflow: 'hidden' }]}>
          <MosaicoTooltip />
          <View style={{ alignItems: 'center', flexDirection: 'row', gap: 8 }}>
            <IconoNodo color="#FFFFFF" size={20} />
            <Texto style={[styles.etiquetaTitulo, { width: 'auto' }]}>{nodo.titulo}</Texto>
          </View>
          <Texto style={styles.etiquetaMeta}>Lección clave para poner a prueba tus habilidades y avanzar.</Texto>
          <Pressable disabled={estado === 'bloqueado'} onPress={onCompletar} style={[styles.botonComenzarContenedor, { marginTop: 14 }]}>
            {({ pressed }) => {
              const hundido = pressed || estado === 'bloqueado';
              return (
                <View style={{ alignItems: 'center', width: '100%' }}>
                  <View style={[styles.botonComenzar, styles.botonComenzarExtrusion, { backgroundColor: oscurecer(color, 0.5), display: estado === 'bloqueado' ? 'none' : 'flex' }]} />
                  <View style={[styles.botonComenzar, { backgroundColor: estado === 'bloqueado' ? 'rgba(0,0,0,0.15)' : color, transform: [{ translateY: hundido ? 4 : 0 }] }]}>
                    <View style={[styles.botonBisel, estado === 'bloqueado' && { borderColor: 'rgba(255,255,255,0.1)' }]} />
                    <View style={{ alignItems: 'center', flexDirection: 'row', gap: 6 }}>
                      <Texto style={[styles.textoBoton, { color: estado === 'bloqueado' ? 'rgba(255,255,255,0.4)' : '#FFFFFF' }]}>
                        {estado === 'bloqueado' ? 'Bloqueado' : estado === 'completado' ? 'Repasar' : 'Comenzar'}
                      </Texto>
                      {estado === 'completado' ? <PixelartIcon color="#FFFFFF" name="chevron-right" size={18} /> : null}
                    </View>
                  </View>
                </View>
              );
            }}
          </Pressable>
        </View>
      </View>
    </View>
  );
}

function DecoracionSendero({ arriba, izquierda, tamano }: { arriba: number; izquierda: number; tamano: number }) {
  return (
    <View pointerEvents="none" style={[styles.decoracion, { left: izquierda, top: arriba, transform: [{ scale: tamano / 34 }], zIndex: 10 }]}>
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
    zIndex: 0,
  },
  lamparaSobrePiedra: {
    zIndex: 1,
  },
  tooltipCaja: {
    borderRadius: 20,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 20,
    alignItems: 'flex-start',
    width: '100%',
    elevation: 10,
    position: 'relative',
    overflow: 'hidden',
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
    width: '100%',
    height: 40,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'absolute',
    top: 0,
  },
  botonComenzarExtrusion: {
    top: 4,
  },
  botonBisel: {
    position: 'absolute',
    top: 2,
    left: 4,
    right: 4,
    bottom: 4,
    borderRadius: 12,
    borderTopWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.4)',
    pointerEvents: 'none',
  },
  textoBoton: {
    fontFamily: 'MontserratAlternates-Bold',
    fontSize: 13,
  },
  tooltipPixelesMarco: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 48,
    height: 48,
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
