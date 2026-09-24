import 'react-native-gesture-handler';
import '../src/servicios/i18n/i18n';

import { useEffect, useState } from 'react';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ProveedoresApp } from '../src/nucleo/proveedor/ProveedoresApp';
import { AnimacionApertura } from '../src/nucleo/arranque/AnimacionApertura';
import { inicializarPlataforma } from '../src/plataforma/inicializarPlataforma';

export default function LayoutRaiz() {
  useEffect(() => { void inicializarPlataforma(); }, []);
  // Se ve en CADA apertura en frío (no es un "visto una sola vez" como el
  // carrusel de introducción) — se superpone a todo mientras la resolución
  // de sesión/routing de más abajo sigue trabajando por detrás, así al
  // terminar el video la pantalla de destino ya está lista.
  const [animacionTerminada, setAnimacionTerminada] = useState(false);
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
      <StatusBar style="dark" />
      <Stack screenOptions={{ animation: 'fade_from_bottom', headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="(publico)" />
        <Stack.Screen name="(principal)" />
        <Stack.Screen name="tienda/gemas" />
        <Stack.Screen name="habitos/[id]" options={{ animation: 'fade', presentation: 'transparentModal' }} />
        <Stack.Screen name="horizon" />
        <Stack.Screen name="habitos/widgets" />
      </Stack>
      {!animacionTerminada && <AnimacionApertura onTerminar={() => setAnimacionTerminada(true)} />}
    </ProveedoresApp>
  );
}
