const CLAVE = 'lestinaty/introduccion-app/v1';

// Recuerda si este dispositivo ya vio el carrusel de intro (antes de
// cualquier cuenta/login) — mismo patrón que pistaSwipeSendero.ts.
export async function haVistoIntroduccionApp(): Promise<boolean> {
  const { default: AsyncStorage } = await import('@react-native-async-storage/async-storage');
  return (await AsyncStorage.getItem(CLAVE)) === '1';
}

export async function marcarIntroduccionAppVista(): Promise<void> {
  const { default: AsyncStorage } = await import('@react-native-async-storage/async-storage');
  await AsyncStorage.setItem(CLAVE, '1');
}
