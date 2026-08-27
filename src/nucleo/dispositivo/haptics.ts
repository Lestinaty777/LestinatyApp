import * as Haptics from 'expo-haptics';
import { Platform, Vibration } from 'react-native';

type TipoHaptic = 'accion' | 'confirmacion' | 'seleccion' | 'toggle';

const duracionesFallback: Record<TipoHaptic, number> = {
  accion: 16,
  confirmacion: 22,
  seleccion: 12,
  toggle: 16,
};

function vibrarFallback(tipo: TipoHaptic) {
  if (Platform.OS === 'web') {
    return;
  }

  try {
    Vibration.vibrate(duracionesFallback[tipo]);
  } catch {
    // Algunos dispositivos bloquean vibracion; nunca debe romper la UI.
  }
}

function obtenerHapticAndroid(tipo: TipoHaptic) {
  if (tipo === 'confirmacion') return Haptics.AndroidHaptics.Confirm;
  if (tipo === 'toggle') return Haptics.AndroidHaptics.Toggle_On;
  if (tipo === 'seleccion') return Haptics.AndroidHaptics.Segment_Tick;

  return Haptics.AndroidHaptics.Virtual_Key;
}

export function hapticSeguro(tipo: TipoHaptic = 'seleccion') {
  if (Platform.OS === 'web') {
    return;
  }

  void (async () => {
    try {
      if (Platform.OS === 'android' && typeof Haptics.performAndroidHapticsAsync === 'function') {
        await Haptics.performAndroidHapticsAsync(obtenerHapticAndroid(tipo));
        return;
      }

      if (tipo === 'confirmacion' && typeof Haptics.impactAsync === 'function') {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        return;
      }

      if (typeof Haptics.selectionAsync === 'function') {
        await Haptics.selectionAsync();
        return;
      }
    } catch {
      vibrarFallback(tipo);
      return;
    }

    vibrarFallback(tipo);
  })();
}
