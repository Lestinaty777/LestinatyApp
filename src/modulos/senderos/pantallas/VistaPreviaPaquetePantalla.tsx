import { useMemo, useState } from 'react';
import { Pressable, View } from 'react-native';
import { Check } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Texto } from '../../../diseno';
import { MAPAS_POR_NIVEL } from '../Mapas';
import { PAQUETES_ARBOL } from '../algoritmo/registroPaquetesArbol';
import { ContenedorMapaSenderos } from '../componentes/mapa/ContenedorMapaSenderos';
import type { NodoMapaSendero } from '../datos/mapaEjercicio.mock';
import { useEscala } from '../../../diseno/tema/MasterColorContext';

// Herramienta de revisión visual, NO para usuarios finales — no está en
// ningún tab, se llega a mano desde TiendaArbolesPantalla ("Vista previa de
// niveles"). Sirve para ver de un vistazo cómo se ve un paquete de árbol en
// sus 7 niveles reales sin tener que crear un hábito real ni forzar 33 días
// de progreso — genera nodos falsos solo para que el mapa dibuje la cantidad
// correcta según Mapas/mapaNivelN, nada de esto toca la base de datos.
function construirNodosPreview(cantidad: number): NodoMapaSendero[] {
  return Array.from({ length: cantidad }, (_, indice) => ({
    estado: indice === 0 ? 'activo' : 'bloqueado',
    icono: Check,
    id: `preview-${indice}`,
    subtitulo: `Día ${indice + 1}`,
    titulo: `Día ${indice + 1}`,
  }));
}

export function VistaPreviaPaquetePantalla() {
  const esc = useEscala();
  const paquetesDisponibles = Object.keys(PAQUETES_ARBOL);
  const [paqueteId, setPaqueteId] = useState(paquetesDisponibles[0] ?? 'aurelia');
  const [nivel, setNivel] = useState(1);
  const mapaNivel = MAPAS_POR_NIVEL[nivel];
  const nodos = useMemo(() => construirNodosPreview(mapaNivel?.cantidadNodos ?? 3), [mapaNivel]);
  const paquete = PAQUETES_ARBOL[paqueteId];

  return (
    <SafeAreaView edges={['top']} style={{ backgroundColor: '#111318', flex: 1 }}>
      <Texto style={{ color: '#FFF', fontFamily: 'MontserratAlternates-Bold', fontSize: 16, paddingHorizontal: 16, paddingTop: 8 }}>Vista previa de paquete (dev)</Texto>

      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, padding: 16 }}>
        {paquetesDisponibles.map((id) => (
          <Pressable
            key={id}
            onPress={() => setPaqueteId(id)}
            style={{ backgroundColor: id === paqueteId ? '#FFFFFF' : 'rgba(255,255,255,0.15)', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 8 }}
          >
            <Texto style={{ color: id === paqueteId ? '#111' : '#FFF', fontFamily: 'MontserratAlternates-Bold', textTransform: 'capitalize' }}>{id}</Texto>
          </Pressable>
        ))}
      </View>

      <View style={{ flexDirection: 'row', gap: 6, paddingBottom: 8, paddingHorizontal: 16 }}>
        {[1, 2, 3, 4, 5, 6, 7].map((n) => (
          <Pressable
            key={n}
            onPress={() => setNivel(n)}
            style={{ alignItems: 'center', backgroundColor: n === nivel ? '#FFFFFF' : 'rgba(255,255,255,0.15)', borderRadius: 16, height: 32, justifyContent: 'center', width: 32 }}
          >
            <Texto style={{ color: n === nivel ? '#111' : '#FFF', fontFamily: 'MontserratAlternates-Bold' }}>{n}</Texto>
          </Pressable>
        ))}
      </View>

      <Texto style={{ color: 'rgba(255,255,255,0.7)', paddingBottom: 8, paddingHorizontal: 16 }}>
        {mapaNivel?.titulo ?? `Nivel ${nivel}`} · {mapaNivel?.cantidadNodos ?? '?'} nodos
      </Texto>

      <View style={{ flex: 1 }}>
        {!paquete ? (
          <Texto style={{ color: '#FFF', padding: 16 }}>No hay paquetes con arte real cargado todavía.</Texto>
        ) : (
          <ContenedorMapaSenderos
            key={`${paqueteId}-${nivel}`}
            altura={700}
            categoriaId="habitos"
            color={esc.jade.l70}
            enfocado={false}
            nivel={nivel}
            nodos={nodos}
            paqueteId={paqueteId}
            progresoPastoTemprano={nivel >= 4 ? 1 : nivel / 3}
            subcategoriaId={`preview-${paqueteId}-${nivel}`}
          />
        )}
      </View>
    </SafeAreaView>
  );
}
