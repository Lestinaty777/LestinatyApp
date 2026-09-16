import { Redirect, Tabs } from 'expo-router';
import { Image, Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { MasterGlass, Texto } from '../../src/diseno';
import { usarEstadoAcceso } from '../../src/modulos/acceso/acceso.estado';

export default function LayoutPrincipal() {
  const cargandoSesion = usarEstadoAcceso((estado) => estado.cargandoSesion);
  const usuario = usarEstadoAcceso((estado) => estado.usuario);
  const insets = useSafeAreaInsets();

  if (cargandoSesion) {
    return null;
  }

  if (!usuario) {
    return <Redirect href="/(publico)/iniciar-sesion" />;
  }

  return (
    <Tabs
      tabBar={(props) => <BarraNavegacionPrincipal {...props} />}
      screenOptions={{
        headerShown: false,
        headerTitleAlign: 'center',
        animation: 'fade',
        tabBarStyle: {
          backgroundColor: 'transparent',
          borderTopWidth: 0,
          elevation: 0,
          height: insets.bottom + 108,
          position: 'absolute',
          shadowOpacity: 0,
        },
      }}
    >
      <Tabs.Screen
        name="hoy"
        options={{ title: 'Hoy' }}
      />
      <Tabs.Screen
        name="senderos"
        options={{ title: 'Senderos' }}
      />
      <Tabs.Screen
        name="insights"
        options={{ title: 'Insights' }}
      />
      <Tabs.Screen
        name="tienda"
        options={{ href: null }}
      />
      <Tabs.Screen
        name="metas"
        options={{ href: null }}
      />
      <Tabs.Screen
        name="mi-espacio"
        options={{ href: null }}
      />
      <Tabs.Screen
        name="direccion"
        options={{ title: 'Configuración' }}
      />
    </Tabs>
  );
}

const DESTINOS_BARRA = [
  { etiqueta: 'Inicio', ruta: 'hoy' },
  { etiqueta: 'Explorar', ruta: 'senderos' },
  { central: true, etiqueta: 'Tienda', ruta: 'tienda' },
  { etiqueta: 'Insights', ruta: 'insights' },
  { etiqueta: 'Perfil', ruta: 'direccion' },
] as const;

const ICONOS_NAVEGACION: Record<string, number> = {
  direccion: require('../../assets/icons/navegacion/perfil.png'),
  hoy: require('../../assets/icons/navegacion/hoy.png'),
  insights: require('../../assets/icons/navegacion/inisghts.png'),
  senderos: require('../../assets/icons/navegacion/explorar.png'),
  tienda: require('../../assets/icons/navegacion/tienda.png'),
};

function BarraNavegacionPrincipal({ navigation, state, style }: { navigation: any; state: { index: number; routes: Array<{ key: string; name: string }> }; style?: any }) {
  const insets = useSafeAreaInsets();
  const rutaActiva = state.routes[state.index]?.name;

  const abrir = (ruta: string) => {
    const evento = navigation.emit({ canPreventDefault: true, target: ruta, type: 'tabPress' });
    if (!evento.defaultPrevented) navigation.navigate(ruta);
  };

  return (
    <SafeAreaView edges={['bottom']} style={[styles.areaSegura, { height: insets.bottom + 108 }, style]}>
    <View style={styles.contenedor}>
      <MasterGlass blur style={styles.barra}>
        {DESTINOS_BARRA.map(({ etiqueta, ruta, ...opciones }) => {
          const central = 'central' in opciones && opciones.central === true;
          const activo = ruta === rutaActiva;
          if (central) return <View key={ruta} style={styles.espacioCentral} />;
          return (
            <Pressable accessibilityRole="tab" accessibilityState={{ selected: activo }} key={ruta} onPress={() => abrir(ruta)} style={styles.destino}>
              <Image resizeMode="contain" source={ICONOS_NAVEGACION[ruta]} style={styles.iconoNavegacion} />
              <Texto style={[styles.etiqueta, activo && styles.etiquetaActiva]}>{etiqueta}</Texto>
              {activo && <View style={styles.indicador} />}
            </Pressable>
          );
        })}
      </MasterGlass>

      <Pressable accessibilityLabel="Tienda" accessibilityRole="tab" accessibilityState={{ selected: rutaActiva === 'tienda' }} onPress={() => abrir('tienda')} style={styles.botonCentral}>
        <MasterGlass forma="heptagono" mastery style={styles.circuloCentral}><View style={styles.contenedorIconoCentral}><Image resizeMode="contain" source={ICONOS_NAVEGACION.tienda} style={styles.iconoNavegacionCentral} /></View></MasterGlass>
        <Texto style={[styles.etiquetaCentral, rutaActiva === 'tienda' && styles.etiquetaActiva]}>Tienda</Texto>
      </Pressable>
    </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  areaSegura: { justifyContent: 'flex-end' },
  barra: { flexDirection: 'row', height: 72 },
  botonCentral: { alignItems: 'center', height: 104, justifyContent: 'flex-start', left: '40%', position: 'absolute', top: -2, width: '20%' },
  circuloCentral: { alignItems: 'center', height: 72, justifyContent: 'center', width: 72 },
  contenedor: { height: 108, justifyContent: 'flex-end', marginHorizontal: 16 },
  contenedorIconoCentral: { alignItems: 'center', flex: 1, justifyContent: 'center' },
  destino: { alignItems: 'center', flex: 1, height: 72, justifyContent: 'center', paddingTop: 3 },
  espacioCentral: { flex: 1 },
  etiqueta: { color: '#20653A', fontFamily: 'MontserratAlternates-Bold', fontSize: 10, marginTop: 1 },
  etiquetaActiva: { color: '#124C29' },
  etiquetaCentral: { color: '#20653A', fontFamily: 'MontserratAlternates-Bold', fontSize: 10, marginTop: 1 },
  indicador: { backgroundColor: '#208A42', borderRadius: 4, bottom: 5, height: 5, position: 'absolute', width: 5 },
  iconoNavegacion: { height: 30, width: 30 },
  iconoNavegacionCentral: { height: 43, width: 43 },
});
