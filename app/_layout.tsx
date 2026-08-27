import 'react-native-gesture-handler';
import '../src/servicios/i18n/i18n';

import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import { ProveedoresApp } from '../src/nucleo/proveedor/ProveedoresApp';

export default function LayoutRaiz() {
  const [fuentesCargadas] = useFonts({
    'Montserrat-Bold': require('../assets/fonts/Montserrat/static/Montserrat-Bold.ttf'),
    'Montserrat-Medium': require('../assets/fonts/Montserrat/static/Montserrat-Medium.ttf'),
    'Montserrat-SemiBold': require('../assets/fonts/Montserrat/static/Montserrat-SemiBold.ttf'),
    'MontserratUnderline-Bold': require('../assets/fonts/Montserrat_Underline/static/MontserratUnderline-Bold.ttf'),
    'MontserratUnderline-SemiBold': require('../assets/fonts/Montserrat_Underline/static/MontserratUnderline-SemiBold.ttf'),
    'MontserratAlternates-Bold': require('../assets/fonts/Montserrat_Alternates -Subtitle/MontserratAlternates-Bold.ttf'),
    'MontserratAlternates-Medium': require('../assets/fonts/Montserrat_Alternates -Subtitle/MontserratAlternates-Medium.ttf'),
    'MontserratAlternates-SemiBold': require('../assets/fonts/Montserrat_Alternates -Subtitle/MontserratAlternates-SemiBold.ttf'),
  });
  if (!fuentesCargadas) {
    return null;
  }

  return (
    <ProveedoresApp>
      <Stack screenOptions={{ animation: 'fade_from_bottom', headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="(publico)" />
        <Stack.Screen name="(principal)" />
        <Stack.Screen name="senderos/activos" />
        <Stack.Screen name="senderos/[id]" />
        <Stack.Screen name="tienda/producto/[id]" />
        <Stack.Screen name="tienda/pago" />
        <Stack.Screen name="metas/[id]" />
      </Stack>
    </ProveedoresApp>
  );
}
