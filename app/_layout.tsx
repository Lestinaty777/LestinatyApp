import 'react-native-gesture-handler';
import '../src/servicios/i18n/i18n';

import { useEffect } from 'react';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import { ProveedoresApp } from '../src/nucleo/proveedor/ProveedoresApp';
import { inicializarOneSignal } from '../src/nucleo/notificaciones/oneSignal';
import { inicializarCompras } from '../src/nucleo/compras/revenueCat';

export default function LayoutRaiz() {
  useEffect(() => { inicializarOneSignal(); inicializarCompras(); }, []);
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
        <Stack.Screen name="senderos/analisis" />
        <Stack.Screen name="senderos/leccion" options={{ presentation: 'fullScreenModal' }} />
        <Stack.Screen name="senderos/[id]" />
        <Stack.Screen name="tienda/gemas" />
        <Stack.Screen name="tienda/producto/[id]" />
        <Stack.Screen name="tienda/pago" />
        <Stack.Screen name="metas/[id]" />
        <Stack.Screen name="habitos/[id]" options={{ animation: 'fade', presentation: 'transparentModal' }} />
        <Stack.Screen name="horizon" />
        <Stack.Screen name="habitos/widgets" />
      </Stack>
    </ProveedoresApp>
  );
}
