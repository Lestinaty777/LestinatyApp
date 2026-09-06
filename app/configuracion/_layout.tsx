import { Stack } from 'expo-router';
import { colores } from '../../src/diseno';

export default function ConfiguracionLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: {
          backgroundColor: colores.fondo,
        },
        headerTintColor: colores.texto,
        headerTitleStyle: {
          fontFamily: 'MontserratAlternates-Bold',
        },
        headerShadowVisible: false,
      }}
    >
      <Stack.Screen name="index" options={{ title: 'Configuración' }} />
      <Stack.Screen name="privacidad" options={{ title: 'Privacidad' }} />
    </Stack>
  );
}
