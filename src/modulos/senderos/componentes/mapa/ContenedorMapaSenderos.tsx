import React, { useMemo, useRef, useState } from 'react';
import { ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';
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

export function ContenedorMapaSenderos({ altura, color, enfocado, subcategoriaId }: ContenedorMapaSenderosProps) {
  const { width } = useWindowDimensions();
  const scrollRef = useRef<ScrollView>(null);
  const nodos = obtenerNodosMapaMock(subcategoriaId);
  const nodoActivo = nodos.find((nodo) => nodo.estado === 'activo')?.id ?? '';
  const [seleccionado, setSeleccionado] = useState(nodoActivo);
  const altoContenido = Math.max(altura, margenSuperior + margenInferior + Math.max(0, nodos.length - 1) * separacionVertical + 88);
  const centro = width / 2;
  const desviaciones = [0, -50, 38, -42, 24];
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

  if (nodos.length === 0) return null;

  function seleccionarNodo(id: string, indice: number) {
    setSeleccionado(id);
    if (enfocado) {
      scrollRef.current?.scrollTo({ animated: true, y: Math.max(0, margenSuperior + indice * separacionVertical - altura * 0.34) });
    }
  }

  return (
    <ScrollView
      ref={scrollRef}
      nestedScrollEnabled
      overScrollMode="never"
      scrollEnabled={enfocado}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={[styles.contenido, { minHeight: altoContenido }]}
    >
      <Svg height={altoContenido} pointerEvents="none" style={StyleSheet.absoluteFill} width={width}>
        {conexiones.map((conexion) => (
          <Path
            d={conexion.d}
            fill="none"
            key={conexion.id}
            stroke={conexion.activa ? color : '#D2CEC8'}
            strokeDasharray={conexion.activa ? undefined : '4 8'}
            strokeLinecap="round"
            strokeWidth={conexion.activa ? 6 : 4}
          />
        ))}
      </Svg>

      {nodos.map((nodo, indice) => {
        const posicion = posiciones[indice];
        const activo = seleccionado === nodo.id;
        return (
          <View key={nodo.id} style={[styles.nodoPosicion, { left: posicion.x - 36, top: posicion.y - 36 }]}>
            <NodoSendero Icono={nodo.icono} color={color} estado={nodo.estado} seleccionado={activo} onPress={() => seleccionarNodo(nodo.id, indice)} />
            {activo ? (
              <View style={styles.etiqueta}>
                <Texto numberOfLines={1} style={styles.etiquetaTitulo}>{nodo.titulo}</Texto>
                <Texto style={[styles.etiquetaMeta, { color }]}>{nodo.subtitulo}</Texto>
              </View>
            ) : null}
          </View>
        );
      })}

      {nodoSeleccionado ? <View accessibilityElementsHidden style={styles.lectorOculto}><Texto>{nodoSeleccionado.titulo}</Texto></View> : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  contenido: {
    position: 'relative',
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
