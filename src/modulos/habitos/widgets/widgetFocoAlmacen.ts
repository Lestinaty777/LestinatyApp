import AsyncStorage from '@react-native-async-storage/async-storage';

// Guarda qué hábito eligió el usuario para el widget "Hábito Foco" — lo lee
// tanto la app (pantalla de configuración) como el task handler headless del
// widget (widgetTaskHandler.tsx), por eso vive en su propio archivo sin
// depender de React ni de react-native-android-widget.
const CLAVE_HABITO_WIDGET_FOCO = '@lestinaty_habito_widget_foco_id';

export async function obtenerHabitoWidgetSeleccionadoId(): Promise<string | null> {
  try {
    return await AsyncStorage.getItem(CLAVE_HABITO_WIDGET_FOCO);
  } catch {
    return null;
  }
}

export async function guardarHabitoWidgetSeleccionado(habitoId: string): Promise<void> {
  try {
    await AsyncStorage.setItem(CLAVE_HABITO_WIDGET_FOCO, habitoId);
  } catch {
    // Si falla, el widget sigue usando el último foco guardado (o el hábito pendiente por defecto).
  }
}
