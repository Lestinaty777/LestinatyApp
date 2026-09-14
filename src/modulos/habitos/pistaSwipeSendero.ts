const CLAVE = 'lestinaty/pista-swipe-sendero/v1';

// Recuerda si el usuario ya descubrió que puede arrastrar el ícono del hábito
// hacia el chevron para ir a su sendero — para dejar de mostrarle la pista
// animada una vez que ya lo sabe.
export async function haVistoPistaSwipeSendero(): Promise<boolean> {
  const { default: AsyncStorage } = await import('@react-native-async-storage/async-storage');
  return (await AsyncStorage.getItem(CLAVE)) === '1';
}

export async function marcarPistaSwipeSenderoVista(): Promise<void> {
  const { default: AsyncStorage } = await import('@react-native-async-storage/async-storage');
  await AsyncStorage.setItem(CLAVE, '1');
}
