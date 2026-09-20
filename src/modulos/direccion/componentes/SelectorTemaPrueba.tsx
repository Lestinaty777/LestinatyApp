import { Pressable, StyleSheet, View } from 'react-native';
import { useQuery } from '@tanstack/react-query';

import { MasterGlass, TONO_ESMERALDA, Texto, useTonoMaster } from '../../../diseno';
import { useTemaMasterGlobal } from '../../../nucleo/proveedor/ProveedorTemaMaster';
import { obtenerCatalogoArboles } from '../../tienda/gemas.servicio';

// TEMPORAL — prueba visual del tema global. Lista Esmeralda + los paquetes del
// catálogo real; elegir uno tiñe toda la app (persiste en AsyncStorage).
// Quitar (o convertir en ajuste real) después de validar el tema. Si el tema
// global pasa a ser un ajuste de producto, decidir si se desbloquea por paquete
// poseído y validarlo también en el backend.
const ESMERALDA = { id: 'esmeralda', masterPackColor: TONO_ESMERALDA.acento, nombre: 'Esmeralda' };

export function SelectorTemaPrueba() {
  const tono = useTonoMaster();
  const { elegir } = useTemaMasterGlobal();
  const catalogo = useQuery({ queryKey: ['tienda', 'catalogoArboles'], queryFn: obtenerCatalogoArboles });
  const opciones = [ESMERALDA, ...(catalogo.data ?? [])];

  return (
    <View style={estilos.grupo}>
      <Texto style={[estilos.titulo, { color: tono.paleta.suave }]}>TEMA DE COLOR (PRUEBA)</Texto>
      <MasterGlass style={estilos.tarjeta}>
        <View style={estilos.fila}>
          {opciones.map((paquete) => {
            const activo = paquete.id === tono.id;
            return (
              <Pressable
                accessibilityLabel={`Tema ${paquete.nombre}`}
                accessibilityState={{ selected: activo }}
                key={paquete.id}
                onPress={() => elegir(paquete.id === ESMERALDA.id ? null : { id: paquete.id, masterPackColor: paquete.masterPackColor })}
                style={[estilos.opcion, activo && { borderColor: tono.paleta.texto }]}
              >
                <View style={[estilos.punto, { backgroundColor: paquete.masterPackColor }]} />
                <Texto style={[estilos.nombre, { color: tono.paleta.texto }]}>{paquete.nombre}</Texto>
              </Pressable>
            );
          })}
        </View>
      </MasterGlass>
    </View>
  );
}

const estilos = StyleSheet.create({
  grupo: { gap: 8 },
  titulo: { fontFamily: 'Montserrat-Bold', fontSize: 11, letterSpacing: 0.8 },
  tarjeta: { padding: 12 },
  fila: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  opcion: { alignItems: 'center', borderColor: 'transparent', borderRadius: 999, borderWidth: 2, flexDirection: 'row', gap: 6, paddingHorizontal: 10, paddingVertical: 6 },
  punto: { borderColor: 'rgba(0,0,0,0.15)', borderRadius: 8, borderWidth: 1, height: 16, width: 16 },
  nombre: { fontFamily: 'Montserrat-Bold', fontSize: 12 },
});
