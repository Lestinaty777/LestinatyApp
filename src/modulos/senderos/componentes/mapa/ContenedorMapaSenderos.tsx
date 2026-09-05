import React, { useMemo, useRef, useState } from 'react';
import { Animated, Image, ScrollView, StyleSheet, useWindowDimensions, View, Pressable, TouchableWithoutFeedback } from 'react-native';
import { useRouter } from 'expo-router';
import Svg, { Path, Rect, Defs, Pattern } from 'react-native-svg';

import { Texto } from '../../../../diseno';
import { crearTemaMapa, generarMapaProcedural, type CategoriaMapaId } from '../../algoritmo/mapaProcedural';
import { obtenerAssetBioma, registroBiomas } from '../../algoritmo/registroBiomas';
import { obtenerNodosMapaMock } from '../../datos/mapaEjercicio.mock';
import { PixelartIcon } from '../../../../diseno/iconos/PixelartIcon';
import { CaminoHojasSendero } from './CaminoHojasSendero';
import { LamparaSendero } from './LamparaSendero';

import { NodoSendero } from './NodoSendero';

type ContenedorMapaSenderosProps = {
  altura: number;
  categoriaId: CategoriaMapaId;
  color: string;
  enfocado: boolean;
  subcategoriaId: string;
};

const separacionVertical = 112;
const margenSuperior = 16;
const margenInferior = 64;
const AnimatedPath = Animated.createAnimatedComponent(Path);
const hojasVisiblesPorNodo = [true, false, true, true];

function oscurecer(color: string, factor = 0.7) {
  const hex = color.replace('#', '');
  const canal = (inicio: number) => Math.round(parseInt(hex.slice(inicio, inicio + 2), 16) * factor).toString(16).padStart(2, '0');
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

export function ContenedorMapaSenderos({ altura, categoriaId, color, enfocado, subcategoriaId }: ContenedorMapaSenderosProps) {
  const { width } = useWindowDimensions();
  const router = useRouter();
  const scrollRef = useRef<ScrollView>(null);
  const [anchoMapa, setAnchoMapa] = useState(0);
  const nodos = obtenerNodosMapaMock(subcategoriaId);
  const ultimoCompletadoInicial = Math.max(-1, nodos.reduce((ultimo, nodo, indice) => nodo.estado === 'completado' ? indice : ultimo, -1));
  const [ultimoCompletado, setUltimoCompletado] = useState(ultimoCompletadoInicial);
  const indiceNodoActual = Math.min(nodos.length - 1, ultimoCompletado + 1);
  const idNodoActual = nodos[indiceNodoActual]?.id ?? '';
  const [seleccionado, setSeleccionado] = useState(idNodoActual);
  const [conexionEnCurso, setConexionEnCurso] = useState<number | null>(null);
  const progresoConexion = useRef(new Animated.Value(0)).current;
  const altoContenido = Math.max(altura, margenSuperior + Math.max(0, nodos.length - 1) * separacionVertical + 430);
  const anchoEscena = anchoMapa || width;
  const temaMapa = useMemo(() => crearTemaMapa(categoriaId, color, subcategoriaId), [categoriaId, color, subcategoriaId]);
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
  const desplazamientoTrazo = progresoConexion.interpolate({ inputRange: [0, 1], outputRange: [176, 0] });

  if (nodos.length === 0) return null;

  function seleccionarNodo(id: string, indice: number) {
    setSeleccionado(id);
    if (enfocado) {
      scrollRef.current?.scrollTo({ animated: true, y: Math.max(0, margenSuperior + indice * separacionVertical - altura * 0.34) });
    }
  }

  function completarNodo(indice: number) {
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
    <ScrollView
      ref={scrollRef}
      nestedScrollEnabled
      onLayout={({ nativeEvent }) => medirAnchoMapa(nativeEvent.layout.width)}
      overScrollMode="never"
      scrollEnabled={true}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={[styles.contenido, { minHeight: altoContenido }]}
    >
      <TouchableWithoutFeedback onPress={() => setSeleccionado('')}>
      <View style={{ height: altoContenido, width: anchoEscena }}>
        
        {/* Bases Isométricas decorativas a los lados (FUERA de la perspectiva 3D para evitar aplastamiento) */}
        {(() => {
           const assetBase = obtenerAssetBioma(categoriaId, 'base');
           if (!assetBase) return null;
           return (
             <View pointerEvents="none" style={[StyleSheet.absoluteFill, { zIndex: 0 }]}>
               {/* Bases grandes en la parte superior, más separadas */}
               <Image source={assetBase.fuente} style={{ position: 'absolute', top: -60, left: -50, width: 240, height: 240, opacity: 0.9, resizeMode: 'contain' }} />
               <Image source={assetBase.fuente} style={{ position: 'absolute', top: -30, right: -60, width: 260, height: 260, opacity: 0.9, resizeMode: 'contain', transform: [{ scaleX: -1 }] }} />
               
               {/* Bases laterales controladas */}
               <Image source={assetBase.fuente} style={{ position: 'absolute', top: 90, left: -100, width: 200, height: 200, opacity: 0.9, resizeMode: 'contain' }} />
               <Image source={assetBase.fuente} style={{ position: 'absolute', top: 220, right: -100, width: 220, height: 220, opacity: 0.9, resizeMode: 'contain', transform: [{ scaleX: -1 }] }} />
               <Image source={assetBase.fuente} style={{ position: 'absolute', top: 400, left: -120, width: 240, height: 240, opacity: 0.9, resizeMode: 'contain' }} />
               <Image source={assetBase.fuente} style={{ position: 'absolute', top: 650, right: -120, width: 220, height: 220, opacity: 0.9, resizeMode: 'contain', transform: [{ scaleX: -1 }] }} />
               <Image source={assetBase.fuente} style={{ position: 'absolute', top: 850, left: -100, width: 200, height: 200, opacity: 0.9, resizeMode: 'contain' }} />
             </View>
           );
        })()}

        <View style={[styles.escenaPerspectiva, StyleSheet.absoluteFill, { zIndex: 1 }]}>
        {mapa.hojas.map((hojas, indice) => {
          if (categoriaId !== 'rutinas' && !hojasVisiblesPorNodo[indice]) return null;
          return (
            <View
              key={`hojas-${indice}`}
              pointerEvents="none"
              style={[
                styles.hojasCamino,
                {
                  left: hojas.x,
                  top: hojas.y,
                  transform: [{ scaleX: hojas.lado === 'derecha' ? 1 : -1 }],
                },
              ]}
            >
              <CaminoHojasSendero color={temaMapa.acento} opacidad={1} tamano={hojas.tamano} />
            </View>
          );
        })}

        {mapa.decoraciones.map((decoracion, indice) => {
          const asset = obtenerAssetBioma(categoriaId, decoracion.assetId);
          if (!asset) return null;
          const tamano = 172 * decoracion.escala;
          return (
            <View
              key={`bioma-${decoracion.assetId}-${indice}`}
              pointerEvents="none"
              style={[styles.decoracionBioma, {
                height: tamano,
                left: decoracion.x,
                top: decoracion.y,
                width: tamano,
              }]}
            >
              <Image resizeMode="contain" source={asset.fuente} style={styles.decoracionBiomaImagen} />
            </View>
          );
        })}
        <Svg height={altoContenido} pointerEvents="none" style={StyleSheet.absoluteFill} width={anchoEscena}>
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

        {/* The snow sits above the routine scenery so it remains visible, but below interactive map elements. */}
        {/* Snow removed to prevent canvaskit error */}

        {mapa.lamparas.map((lampara, indice) => (
          <DecoracionSendero key={`lampara-${indice}`} izquierda={lampara.x} tamano={lampara.tamano} arriba={lampara.y} />
        ))}

        {nodos.map((nodo, indice) => {
          const posicion = posiciones[indice];
          const esNodoActual = indice === indiceNodoActual;
          const esSeleccionado = seleccionado === nodo.id;
          const estadoVisual = indice <= ultimoCompletado ? 'completado' : esNodoActual ? 'activo' : 'bloqueado';
          const asentado = esSeleccionado;
          const escalaEscena = Math.max(0.78, 1.1 - indice * 0.07);
          return (
            <View key={nodo.id} style={[styles.nodoPosicion, { left: posicion.x - 36, top: posicion.y - 36 }]}>
              <NodoSendero Icono={nodo.icono} asentado={asentado} color={color} escalaEscena={escalaEscena} estado={estadoVisual} seleccionado={esSeleccionado} onCompletar={() => completarNodo(indice)} onPress={() => seleccionarNodo(nodo.id, indice)} />
              {esSeleccionado ? (() => {
                  const xRelativoPantalla = anchoEscena / 2;
                  const centroNodoRelativo = 36;
                  const anchoTooltip = 340;
                  const leftEtiqueta = xRelativoPantalla - posicion.x - (anchoTooltip / 2) + centroNodoRelativo;
                  const leftFlechita = centroNodoRelativo - leftEtiqueta - 10;
                  return (
                <View style={[styles.etiqueta, { left: leftEtiqueta }]}>
                  <View style={[styles.tooltipFlechita, { backgroundColor: oscurecer(color, 0.75), position: 'absolute', top: -10, left: leftFlechita }]} />
                  <View style={{ width: '100%' }}>
                    <View style={[styles.tooltipCaja, { position: 'absolute', top: 6, left: 0, right: 0, bottom: -6, backgroundColor: oscurecer(color, 0.4), shadowColor: 'transparent' }]} />
                    <View style={[styles.tooltipCaja, { backgroundColor: oscurecer(color, 0.75), overflow: 'hidden' }]}>
                      <MosaicoTooltip />
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                      {nodo.icono && (() => { const IconoNodo = nodo.icono; return <IconoNodo color="#FFFFFF" size={20} />; })()}
                      <Texto style={[styles.etiquetaTitulo, { width: 'auto' }]}>{nodo.titulo}</Texto>
                    </View>
                    <Texto style={styles.etiquetaMeta}>{'Lección clave para poner a prueba tus habilidades y avanzar.'}</Texto>
                    
                    
                    <Pressable 
                      disabled={estadoVisual === 'bloqueado'} 
                      onPress={() => completarNodo(indice)}
                      style={({ pressed }) => [styles.botonComenzarContenedor, { marginTop: 14 }]}
                    >
                      {({ pressed }) => {
                        const hundido = pressed || estadoVisual === 'bloqueado';
                        return (
                          <View style={{ width: '100%', alignItems: 'center' }}>
                            {/* Extrusión (Sombra inferior fija) */}
                            <View style={[styles.botonComenzar, styles.botonComenzarExtrusion, { 
                               backgroundColor: oscurecer(color, 0.5),
                               display: estadoVisual === 'bloqueado' ? 'none' : 'flex'
                            }]} />
                            
                            {/* Superficie del botón */}
                            <View style={[styles.botonComenzar, { 
                               backgroundColor: estadoVisual === 'bloqueado' ? 'rgba(0,0,0,0.15)' : color,
                               transform: [{ translateY: hundido ? 4 : 0 }] 
                            }]}>
                               {/* Bisel (Brillo superior) */}
                               <View style={[styles.botonBisel, estadoVisual === 'bloqueado' && { borderColor: 'rgba(255,255,255,0.1)' }]} />
                               
                               <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                                 <Texto style={[styles.textoBoton, { color: estadoVisual === 'bloqueado' ? 'rgba(255,255,255,0.4)' : '#FFFFFF' }]}>
                                   {estadoVisual === 'bloqueado' ? 'Bloqueado' : estadoVisual === 'completado' ? 'Repasar' : 'Comenzar'}
                                 </Texto>
                                 {estadoVisual === 'completado' && (
                                   <PixelartIcon name="chevron-right" size={18} color="#FFFFFF" />
                                 )}
                               </View>
                            </View>
                          </View>
                        );
                      }}
                    </Pressable>

                    
                    </View>
                  </View>
                </View>
              );})() : null}
            </View>
          );
        })}
      </View>
      </View></TouchableWithoutFeedback>

      {nodoSeleccionado ? <View accessibilityElementsHidden style={styles.lectorOculto}><Texto>{nodoSeleccionado.titulo}</Texto></View> : null}
    </ScrollView>
  );
}

function DecoracionSendero({ arriba, izquierda, tamano }: { arriba: number; izquierda: number; tamano: number }) {
  return (
    <View pointerEvents="none" style={[styles.decoracion, { left: izquierda, top: arriba, transform: [{ scale: tamano / 34 }] }]}>
      <LamparaSendero retraso={arriba} tamano={34} />
    </View>
  );
}

const styles = StyleSheet.create({
  contenido: {
    position: 'relative',
  },
  escenaPerspectiva: {
    transform: [{ perspective: 900 }, { rotateX: '8deg' }, { scaleY: 0.98 }],
    transformOrigin: 'center bottom',
  },
  hojasCamino: {
    position: 'absolute',
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
    position: 'absolute',
    width: 34,
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
    position: 'absolute',
    top: 76,
    width: 340,
    maxWidth: 400,
    zIndex: 10,
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
