import React from 'react';
import { Platform } from 'react-native';
import { requestPinWidget, requestWidgetUpdate } from 'react-native-android-widget';
import type { HabitoResumen } from '../tipos';
import { HabitoFocoWidget, WidgetSinHabitos } from './HabitoFocoWidget';
import { construirPropsHabitoFoco, elegirHabitoFoco } from './mapearHabitoWidget';
import { guardarHabitoWidgetSeleccionado, obtenerHabitoWidgetSeleccionadoId } from './widgetFocoAlmacen';

// Debe coincidir con el "name" del widget configurado en el plugin de Expo
// (app.json) y con el `nameToWidget` de widgetTaskHandler.tsx.
export const NOMBRE_WIDGET_HABITO_FOCO = 'HabitoFoco';

// Empuja el estado actual al widget si ya está en la pantalla de inicio — a
// diferencia del viejo NativeModules.LestinatyWidgetModule (que nunca existió
// nativamente), requestWidgetUpdate es 100% JS y funciona solo con la
// librería instalada, sin escribir ningún módulo nativo propio.
export async function sincronizarWidgetFoco(habitos: HabitoResumen[]): Promise<void> {
  if (Platform.OS !== 'android') return;
  try {
    const focoId = await obtenerHabitoWidgetSeleccionadoId();
    const habito = elegirHabitoFoco(habitos, focoId);
    await requestWidgetUpdate({
      renderWidget: () => (habito ? <HabitoFocoWidget {...construirPropsHabitoFoco(habito)} /> : <WidgetSinHabitos />),
      widgetName: NOMBRE_WIDGET_HABITO_FOCO,
    });
  } catch {
    // No hay ningún widget agregado al home screen todavía, o Android no
    // pudo actualizarlo — no es un error de cara al usuario.
  }
}

export async function elegirHabitoParaWidget(habitoId: string, habitos: HabitoResumen[]): Promise<void> {
  await guardarHabitoWidgetSeleccionado(habitoId);
  await sincronizarWidgetFoco(habitos);
}

// Dispara el prompt nativo de Android para agregar el widget al inicio
// (API 26+, y solo si el launcher lo soporta) — evita las instrucciones
// manuales de "mantén presionado..." cuando el sistema lo permite.
export async function pedirAgregarWidgetFoco(): Promise<boolean> {
  if (Platform.OS !== 'android') return false;
  try {
    return await requestPinWidget({ widgetName: NOMBRE_WIDGET_HABITO_FOCO });
  } catch {
    return false;
  }
}
