import { Check, Flag, Lock, Play } from 'lucide-react-native';
import { StyleSheet, View } from 'react-native';

import { Texto } from '../../../../diseno';
import type { NodoRutina } from '../../construirNodosRutina';

const C = { texto: '#1A1335', tenue: '#7B7494', linea: '#E4DDF0', bloqueado: '#EFEAF6', iconoBloqueado: '#A8A1BD' };
const DIAMETRO = 38;

// La rutina dibujada como camino: nodos que zigzaguean unidos por una línea,
// con la meta de la sesión al final. Versión ligera (solo vistas): el mapa
// isométrico de Hábitos y Tareas es una pantalla completa con su propio
// motor, no un bloque que quepa dentro de la sesión.
export function CaminoRutina({ color, etiquetaAccesible, etiquetaOpcional, nodos }: {
  /** Acento del módulo. */
  color: string;
  /** Texto para lector de pantalla de cada nodo (incluye su estado). */
  etiquetaAccesible: (nodo: NodoRutina) => string;
  etiquetaOpcional: string;
  nodos: readonly NodoRutina[];
}) {
  if (nodos.length === 0) return null;
  return (
    <View style={estilos.camino}>
      {nodos.map((nodo, indice) => {
        const hecho = nodo.estado === 'completado';
        const activo = nodo.estado === 'activo';
        const derecha = indice % 2 === 1;
        const Icono = nodo.esDestino ? Flag : hecho ? Check : activo ? Play : Lock;
        return (
          <View accessibilityLabel={etiquetaAccesible(nodo)} accessible key={nodo.id} style={estilos.fila}>
            {indice > 0 ? <View style={[estilos.tramo, { backgroundColor: hecho || activo ? color : C.linea }]} /> : null}
            <View style={[estilos.contenido, derecha && estilos.contenidoDerecha]}>
              <View
                style={[
                  estilos.nodo,
                  nodo.esDestino && estilos.nodoDestino,
                  hecho ? { backgroundColor: color, borderColor: color } : activo ? { backgroundColor: '#FFFFFF', borderColor: color } : estilos.nodoBloqueado,
                ]}
              >
                <Icono color={hecho ? '#FFFFFF' : activo ? color : C.iconoBloqueado} size={nodo.esDestino ? 18 : 15} strokeWidth={2.6} />
              </View>
              <View style={[estilos.textos, derecha && { alignItems: 'flex-end' }]}>
                <Texto numberOfLines={1} style={[estilos.titulo, !hecho && !activo && { color: C.tenue }, derecha && { textAlign: 'right' }]}>{nodo.titulo}</Texto>
                {!nodo.esDestino && !nodo.esencial ? <Texto style={estilos.opcional}>{etiquetaOpcional}</Texto> : null}
              </View>
            </View>
          </View>
        );
      })}
    </View>
  );
}

const estilos = StyleSheet.create({
  camino: { alignSelf: 'stretch', paddingHorizontal: 18, paddingVertical: 6 },
  fila: { alignItems: 'center' },
  tramo: { borderRadius: 2, height: 18, width: 3 },
  contenido: { alignItems: 'center', alignSelf: 'stretch', flexDirection: 'row', gap: 12 },
  contenidoDerecha: { flexDirection: 'row-reverse' },
  nodo: { alignItems: 'center', borderRadius: DIAMETRO / 2, borderWidth: 2.5, height: DIAMETRO, justifyContent: 'center', width: DIAMETRO },
  nodoDestino: { borderRadius: 12, height: DIAMETRO + 6, width: DIAMETRO + 6 },
  nodoBloqueado: { backgroundColor: C.bloqueado, borderColor: C.linea },
  textos: { flex: 1 },
  titulo: { color: C.texto, fontFamily: 'Montserrat-Bold', fontSize: 14 },
  opcional: { color: C.tenue, fontFamily: 'Montserrat-Medium', fontSize: 11, marginTop: 1 },
});
