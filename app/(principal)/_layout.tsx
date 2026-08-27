import { Redirect, Tabs } from 'expo-router';
import { BlurView } from 'expo-blur';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colores, espaciado } from '../../src/diseno';
import { usarEstadoAcceso } from '../../src/modulos/acceso/acceso.estado';
import { BotonTab, IconoTab, iconosTabs } from '../../src/nucleo/navegacion/BarraTabs';

const radioGlassNavegacion = 18;

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
      screenOptions={{
        headerShown: false,
        headerTitleAlign: 'center',
        tabBarActiveTintColor: colores.texto,
        animation: 'fade',
        tabBarBackground: () => <FondoTabsGlass />,
        tabBarButton: (props) => <BotonTab {...props} />,
        tabBarInactiveTintColor: colores.textoSecundario,
        tabBarShowLabel: false,
        tabBarStyle: {
          backgroundColor: 'transparent',
          borderTopWidth: 0,
          bottom: insets.bottom + espaciado.sm,
          elevation: 0,
          height: 76,
          left: espaciado.lg,
          paddingBottom: 8,
          paddingTop: 8,
          position: 'absolute',
          right: espaciado.lg,
          shadowOpacity: 0,
        },
      }}
    >
      <Tabs.Screen
        name="inicio"
        options={{
          tabBarIcon: ({ focused }) => <IconoTab focused={focused} nombre={iconosTabs.inicio} />,
          title: 'Hoy',
        }}
      />
      <Tabs.Screen
        name="senderos"
        options={{
          tabBarIcon: ({ focused }) => <IconoTab focused={focused} nombre={iconosTabs.senderos} />,
          title: 'Senderos',
        }}
      />
      <Tabs.Screen
        name="tienda"
        options={{
          tabBarIcon: ({ focused }) => <IconoTab focused={focused} nombre={iconosTabs.tienda} />,
          title: 'Tienda',
        }}
      />
      <Tabs.Screen
        name="metas"
        options={{
          tabBarIcon: ({ focused }) => <IconoTab focused={focused} nombre={iconosTabs.metas} />,
          title: 'Metas',
        }}
      />
      <Tabs.Screen
        name="direccion"
        options={{
          tabBarIcon: ({ focused }) => <IconoTab focused={focused} nombre={iconosTabs.direccion} />,
          title: 'Ruta',
        }}
      />
    </Tabs>
  );
}

function FondoTabsGlass() {
  return (
    <BlurView intensity={24} tint="light" style={styles.fondoTabs}>
      <View style={styles.fondoTabsTinte} />
      <View pointerEvents="none" style={styles.fondoTabsBrilloSuperior} />
      <View pointerEvents="none" style={styles.fondoTabsBrilloLateral} />
      <View pointerEvents="none" style={styles.fondoTabsBorde} />
    </BlurView>
  );
}

const styles = StyleSheet.create({
  fondoTabs: {
    borderRadius: radioGlassNavegacion,
    bottom: 0,
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
    overflow: 'hidden',
  },
  fondoTabsTinte: {
    backgroundColor: 'rgba(255, 255, 255, 0.34)',
    bottom: 0,
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
  },
  fondoTabsBrilloSuperior: {
    backgroundColor: 'rgba(255, 255, 255, 0.42)',
    borderRadius: 999,
    height: 14,
    left: 18,
    position: 'absolute',
    right: 18,
    top: 7,
  },
  fondoTabsBrilloLateral: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 999,
    bottom: 16,
    left: 11,
    position: 'absolute',
    top: 16,
    width: 5,
  },
  fondoTabsBorde: {
    borderColor: 'rgba(255, 255, 255, 0.62)',
    borderRadius: radioGlassNavegacion,
    borderTopWidth: 0.8,
    borderWidth: 0.45,
    bottom: 0,
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
  },
});
