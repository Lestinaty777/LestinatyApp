import React, { useMemo, useRef, useState } from 'react';
import { Animated, ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { Texto } from '../../../../diseno';
import { obtenerNodosMapaMock } from '../../datos/mapaEjercicio.mock';
import { NodoSendero } from './NodoSendero';

type ContenedorMapaSenderosProps = {
  altura: number;
  color: string;
  enfocado: boolean;
  subcategoriaId: string;
};

const separacionVertical = 112;
const margenSuperior = 54;
const margenInferior = 64;
const AnimatedPath = Animated.createAnimatedComponent(Path);

export function ContenedorMapaSenderos({ altura, color, enfocado, subcategoriaId }: ContenedorMapaSenderosProps) {
  const { width } = useWindowDimensions();
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
  const altoContenido = Math.max(altura, margenSuperior + margenInferior + Math.max(0, nodos.length - 1) * separacionVertical + 88);
  const anchoEscena = anchoMapa || width;
  const centro = anchoEscena / 2;
  // Los offsets suman cero para que todo el recorrido, no solo el primer nodo, quede centrado.
  const desviaciones = [6, -44, 44, -36, 30];
  const posiciones = useMemo(() => nodos.map((nodo, indice) => ({
    id: nodo.id,
    x: centro + (desviaciones[indice] ?? 0),
    y: margenSuperior + indice * separacionVertical,
  })), [centro, nodos]);
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
      scrollEnabled={enfocado}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={[styles.contenido, { minHeight: altoContenido }]}
    >
      <View style={[styles.escenaPerspectiva, { height: altoContenido, width: anchoEscena }]}>
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

        <DecoracionSendero color={color} izquierda="12%" tamano={34} arriba={104} tipo="arbol" />
        <DecoracionSendero color={color} izquierda="76%" tamano={23} arriba={178} tipo="lampara" />
        <DecoracionSendero color={color} izquierda="15%" tamano={24} arriba={304} tipo="lampara" />
        <DecoracionSendero color={color} izquierda="77%" tamano={39} arriba={382} tipo="arbol" />

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
              {esSeleccionado ? (
                <View style={[styles.etiqueta, { transform: [{ scale: escalaEscena }] }]}>
                  <Texto numberOfLines={1} style={styles.etiquetaTitulo}>{nodo.titulo}</Texto>
                  <Texto style={[styles.etiquetaMeta, { color }]}>{nodo.subtitulo}</Texto>
                </View>
              ) : null}
            </View>
          );
        })}
      </View>

      {nodoSeleccionado ? <View accessibilityElementsHidden style={styles.lectorOculto}><Texto>{nodoSeleccionado.titulo}</Texto></View> : null}
    </ScrollView>
  );
}

function DecoracionSendero({ arriba, color, izquierda, tamano, tipo }: { arriba: number; color: string; izquierda: `${number}%`; tamano: number; tipo: 'arbol' | 'lampara' }) {
  return (
    <View pointerEvents="none" style={[styles.decoracion, { left: izquierda, top: arriba, transform: [{ scale: tamano / 34 }] }]}>
      {tipo === 'arbol' ? (
        <>
          <View style={[styles.copaArbol, { backgroundColor: color }]} />
          <View style={styles.troncoArbol} />
        </>
      ) : (
        <>
          <View style={[styles.luzLampara, { backgroundColor: color }]} />
          <View style={styles.posteLampara} />
          <View style={styles.baseLampara} />
        </>
      )}
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
  decoracion: {
    alignItems: 'center',
    height: 40,
    position: 'absolute',
    width: 34,
  },
  copaArbol: {
    borderRadius: 16,
    height: 28,
    opacity: 0.28,
    width: 28,
  },
  troncoArbol: {
    backgroundColor: '#847264',
    borderRadius: 2,
    height: 15,
    marginTop: -2,
    width: 5,
  },
  luzLampara: {
    borderColor: 'rgba(255,255,255,0.82)',
    borderRadius: 7,
    borderWidth: 1,
    height: 13,
    opacity: 0.65,
    width: 13,
  },
  posteLampara: {
    backgroundColor: '#71695F',
    height: 22,
    marginTop: -1,
    width: 3,
  },
  baseLampara: {
    backgroundColor: '#71695F',
    borderRadius: 3,
    height: 4,
    width: 13,
  },
  etiqueta: {
    alignItems: 'center',
    left: -50,
    position: 'absolute',
    top: 66,
    width: 172,
  },
  etiquetaMeta: {
    fontFamily: 'MontserratAlternates-Bold',
    fontSize: 9,
    marginTop: 2,
  },
  etiquetaTitulo: {
    color: '#34312E',
    fontFamily: 'MontserratAlternates-Bold',
    fontSize: 11,
    textAlign: 'center',
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
