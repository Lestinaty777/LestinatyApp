import { Redirect, Tabs } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, useWindowDimensions, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { cancelAnimation, Easing, useAnimatedStyle, useSharedValue, withSequence, withTiming } from 'react-native-reanimated';

import { MasterGlass, MasterIcon, Texto } from '../../src/diseno';
import { usarEstadoAcceso } from '../../src/modulos/acceso/acceso.estado';
import { useRegaloBienvenidaPendiente, useRegaloTrialHorizonPendiente } from '../../src/modulos/onboarding/onboarding.servicio';
import { RegaloBienvenidaPantalla } from '../../src/modulos/onboarding/pantallas/RegaloBienvenidaPantalla';
import { RegaloTrialHorizonPantalla } from '../../src/modulos/onboarding/pantallas/RegaloTrialHorizonPantalla';
import { useEscala } from '../../src/diseno/tema/MasterColorContext';
import type { EscalaMaster } from '../../src/diseno/tema/escalaEsmeralda';

export default function LayoutPrincipal() {
  const cargandoSesion = usarEstadoAcceso((estado) => estado.cargandoSesion);
  const usuario = usarEstadoAcceso((estado) => estado.usuario);
  const insets = useSafeAreaInsets();
  const { data: regaloPendiente, isLoading: cargandoRegalo } = useRegaloBienvenidaPendiente({ enabled: !!usuario });
  // A diferencia del regalo de bienvenida, este no bloquea: la cuenta ya usa
  // la app con normalidad. `cerradoEnSesion` solo evita que la X vuelva a
  // abrirlo en la misma sesión — si sigue pendiente, reaparece la próxima vez.
  const { data: regaloTrialPendiente } = useRegaloTrialHorizonPendiente({ enabled: !!usuario && !regaloPendiente });
  const [cerradoEnSesion, setCerradoEnSesion] = useState(false);

  if (cargandoSesion || (usuario && cargandoRegalo)) {
    return null;
  }

  if (!usuario) {
    // A la pantalla de acceso "nueva" (con la misma decoración del
    // onboarding, FormularioAccesoOnboarding) — no a la vieja iniciar-sesion
    // suelta. Esto cubre tanto el cierre de sesión manual como cualquier otra
    // caída de sesión mientras se usa la app.
    return <Redirect href="/(publico)/introduccion-acceso" />;
  }

  // Cuenta nueva que todavía no eligió su árbol de bienvenida: bloquea las
  // pestañas hasta que elige. Se autorepara solo si cierra la app a mitad de
  // camino — la próxima vez que abra vuelve a caer acá mismo.
  if (regaloPendiente) {
    return <RegaloBienvenidaPantalla />;
  }

  return (
    <>
    <RegaloTrialHorizonPantalla
      onCerrar={() => setCerradoEnSesion(true)}
      visible={Boolean(regaloTrialPendiente) && !cerradoEnSesion}
    />
    <Tabs
      tabBar={(props) => <BarraNavegacionPrincipal {...props} />}
      screenOptions={{
        headerShown: false,
        headerTitleAlign: 'center',
        // 'fade' entre pestañas: en iOS, si la pestaña nueva es pesada de
        // montar (Senderos con su canvas de Skia, Perfil con muchas
        // MasterGlass), el fundido se queda mostrando la pestaña anterior
        // hasta que la nueva termina de renderizar — pantalla en blanco que
        // luego "parpadea" a la vista correcta. Las barras de tabs no suelen
        // llevar animación de transición (es más un concepto de Stack); sin
        // esta opción, el cambio de pestaña es instantáneo, evitando esa
        // ventana en blanco sin importar qué tan pesada sea la pantalla.
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
        name="direccion"
        options={{ title: 'Configuración' }}
      />
    </Tabs>
    </>
  );
}

const DESTINOS_BARRA = [
  { etiqueta: 'Inicio', ruta: 'hoy' },
  { etiqueta: 'Explorar', ruta: 'senderos' },
  { central: true, etiqueta: 'Tienda', ruta: 'tienda' },
  { etiqueta: 'Insights', ruta: 'insights' },
  { etiqueta: 'Perfil', ruta: 'direccion' },
] as const;

// Nombres del registro de iconos (registroIconos.ts): son verdes, así que siguen el tema.
const ICONOS_NAVEGACION: Record<string, string> = {
  direccion: 'navegacion/perfil',
  hoy: 'navegacion/hoy',
  insights: 'navegacion/insights',
  senderos: 'navegacion/explorar',
  tienda: 'navegacion/tienda',
};

const INDICE_DESTINO: Record<string, number> = { direccion: 4, hoy: 0, insights: 3, senderos: 1, tienda: 2 };

function BarraNavegacionPrincipal({ navigation, state, style }: { navigation: any; state: { index: number; routes: Array<{ key: string; name: string }> }; style?: any }) {
  const styles = useEstilosStyles();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const rutaActiva = state.routes[state.index]?.name;
  const anchoDestino = (width - 32) / DESTINOS_BARRA.length;
  const anchoRecuadroActivo = anchoDestino - 16;
  const indiceActivo = INDICE_DESTINO[rutaActiva] ?? 0;
  const desplazamientoActivo = useSharedValue(indiceActivo * anchoDestino + 8);
  const olaTienda = useSharedValue(0);

  useEffect(() => {
    desplazamientoActivo.value = withTiming(indiceActivo * anchoDestino + 8, { duration: 380, easing: Easing.out(Easing.cubic) });
  }, [anchoDestino, desplazamientoActivo, indiceActivo]);

  useEffect(() => {
    cancelAnimation(olaTienda);
    if (rutaActiva !== 'tienda') { olaTienda.value = 0; return; }
    olaTienda.value = 0;
    olaTienda.value = withSequence(
      withTiming(1, { duration: 220, easing: Easing.out(Easing.quad) }),
      withTiming(0, { duration: 520, easing: Easing.inOut(Easing.quad) }),
    );
  }, [olaTienda, rutaActiva]);

  const estiloRecuadroActivo = useAnimatedStyle(() => ({ transform: [{ translateX: desplazamientoActivo.value }] }));
  const estiloOlaTienda = useAnimatedStyle(() => ({ opacity: olaTienda.value, transform: [{ scaleX: 0.94 + olaTienda.value * 0.12 }, { scaleY: 0.6 + olaTienda.value * 0.4 }] }));

  const abrir = (ruta: string) => {
    const evento = navigation.emit({ canPreventDefault: true, target: ruta, type: 'tabPress' });
    if (!evento.defaultPrevented) navigation.navigate(ruta);
  };

  return (
    <SafeAreaView edges={['bottom']} style={[styles.areaSegura, { height: insets.bottom + 108 }, style]}>
    <View style={styles.contenedor}>
      <MasterGlass blur style={styles.barra}>
        <Animated.View pointerEvents="none" style={[styles.recuadroActivoAnimado, { width: anchoRecuadroActivo }, estiloRecuadroActivo]}>
          <MasterGlass blur compacto style={styles.recuadroActivo} />
        </Animated.View>
        {DESTINOS_BARRA.map(({ etiqueta, ruta, ...opciones }) => {
          const central = 'central' in opciones && opciones.central === true;
          const activo = ruta === rutaActiva;
          if (central) return <View key={ruta} style={styles.espacioCentral} />;
          return (
            <Pressable accessibilityRole="tab" accessibilityState={{ selected: activo }} key={ruta} onPress={() => abrir(ruta)} style={styles.destino}>
              <MasterIcon name={ICONOS_NAVEGACION[ruta]} size={30} />
              <Texto style={[styles.etiqueta, activo && styles.etiquetaActiva]}>{etiqueta}</Texto>
              {activo && <View style={styles.indicador} />}
            </Pressable>
          );
        })}
        <Animated.View pointerEvents="none" style={[styles.olaTienda, estiloOlaTienda]}>
          <MasterGlass mastery style={styles.olaMastery} />
        </Animated.View>
      </MasterGlass>

      <Pressable accessibilityLabel="Tienda" accessibilityRole="tab" accessibilityState={{ selected: rutaActiva === 'tienda' }} onPress={() => abrir('tienda')} style={styles.botonCentral}>
        <MasterGlass forma="heptagono" mastery style={styles.circuloCentral}><View style={styles.contenedorIconoCentral}><MasterIcon name={ICONOS_NAVEGACION.tienda} size={43} /></View></MasterGlass>
        <Texto style={[styles.etiquetaCentral, rutaActiva === 'tienda' && styles.etiquetaActiva]}>Tienda</Texto>
      </Pressable>
    </View>
    </SafeAreaView>
  );
}

const crearEstilosStyles = (esc: EscalaMaster) => StyleSheet.create({
  areaSegura: { justifyContent: 'flex-end', position: 'absolute', bottom: 0, left: 0, right: 0 },
  barra: { flexDirection: 'row', height: 72 },
  botonCentral: { alignItems: 'center', height: 104, justifyContent: 'flex-start', left: '40%', position: 'absolute', top: -2, width: '20%' },
  circuloCentral: { alignItems: 'center', height: 72, justifyContent: 'center', width: 72 },
  contenedor: { height: 108, justifyContent: 'flex-end', marginHorizontal: 16 },
  contenedorIconoCentral: { alignItems: 'center', flex: 1, justifyContent: 'center' },
  destino: { alignItems: 'center', flex: 1, height: 72, justifyContent: 'center', paddingTop: 3 },
  espacioCentral: { flex: 1 },
  etiqueta: { color: esc.jade.l38, fontFamily: 'MontserratAlternates-Bold', fontSize: 10, marginTop: 1 },
  etiquetaActiva: { color: esc.jade.l29 },
  etiquetaCentral: { color: esc.jade.l38, fontFamily: 'MontserratAlternates-Bold', fontSize: 10, marginTop: 1 },
  indicador: { backgroundColor: esc.jade.l49, borderRadius: 4, bottom: 5, height: 5, position: 'absolute', width: 5 },
  olaMastery: { flex: 1 },
  olaTienda: { bottom: 2, height: 5, left: '4%', position: 'absolute', right: '4%', transformOrigin: 'center', zIndex: 1 },
  recuadroActivo: { flex: 1 },
  recuadroActivoAnimado: { bottom: 8, height: 56, left: 0, position: 'absolute', zIndex: 0 },
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
