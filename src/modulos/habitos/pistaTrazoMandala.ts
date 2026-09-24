const CLAVE = 'lestinaty/pista-trazo-mandala/v1';

// Recuerda si el usuario ya trazó alguna mandala: la mano fantasma que
// enseña el gesto sólo aparece la primera vez.
export async function haVistoPistaTrazoMandala(): Promise<boolean> {
  const { default: AsyncStorage } = await import('@react-native-async-storage/async-storage');
  return (await AsyncStorage.getItem(CLAVE)) === '1';
}

export async function marcarPistaTrazoMandalaVista(): Promise<void> {
  const { default: AsyncStorage } = await import('@react-native-async-storage/async-storage');
  await AsyncStorage.setItem(CLAVE, '1');
}
